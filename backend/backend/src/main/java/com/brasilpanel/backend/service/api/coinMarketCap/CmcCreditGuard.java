package com.brasilpanel.backend.service.api.coinMarketCap;

import com.brasilpanel.backend.model.CmcCreditUsage;
import com.brasilpanel.backend.repository.snapshot.CmcCreditUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;

/**
 * Teto de consumo mensal de créditos da CoinMarketCap.
 *
 * <p>O plano Basic dá 15.000 créditos/mês e, esgotados, a fonte morre até o dia 1º.
 * O orçamento padrão de 12.000 (80%) deixa margem para retries e redeploys: ao bater
 * o teto o refresh vira no-op e o painel passa a servir só do banco, em vez de
 * simplesmente parar de funcionar.
 *
 * <p>A contagem usa o {@code credit_count} que a própria API devolve em cada resposta —
 * nunca uma estimativa nossa.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CmcCreditGuard {

    private final CmcCreditUsageRepository repository;

    @Value("${coinmarketcap.monthly-credit-budget:12000}")
    private int monthlyBudget;

    /** Há orçamento para mais uma chamada neste mês? */
    @Transactional(readOnly = true)
    public boolean hasBudget() {
        int used = currentUsage();
        if (used >= monthlyBudget) {
            log.warn("[CMC] Orçamento mensal esgotado: {}/{} créditos — servindo apenas do banco",
                    used, monthlyBudget);
            return false;
        }
        return true;
    }

    /** Créditos já consumidos no mês corrente. */
    @Transactional(readOnly = true)
    public int currentUsage() {
        return repository.findByYearMonth(currentMonth())
                .map(CmcCreditUsage::getCreditsUsed)
                .orElse(0);
    }

    /**
     * Registra o custo de uma chamada.
     *
     * <p>Roda em transação própria ({@code REQUIRES_NEW}): se a persistência do batch
     * falhar depois, o crédito já foi gasto de verdade na API e não pode ser esquecido
     * junto com o rollback.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Integer credits) {
        if (credits == null || credits <= 0) return;

        String month = currentMonth();
        if (repository.addCredits(month, credits) > 0) {
            return;
        }

        // Primeira chamada do mês — cria a linha. A corrida com outra thread é resolvida
        // pela unique constraint: quem perder tenta o incremento de novo.
        try {
            repository.save(CmcCreditUsage.builder()
                    .yearMonth(month)
                    .creditsUsed(credits)
                    .build());
        } catch (DataIntegrityViolationException e) {
            repository.addCredits(month, credits);
        }
    }

    private String currentMonth() {
        return YearMonth.now().toString();   // "2026-07"
    }
}