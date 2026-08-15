import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectField } from './SelectField';

/**
 * O que estes testes protegem é o CONTRATO de acessibilidade, não a aparência.
 * Um combobox feito à mão só é equivalente ao `<select>` nativo se o teclado e
 * o ARIA funcionarem; se isso quebrar, quem navega por teclado ou leitor de
 * tela simplesmente não consegue preencher o perfil, e nada na tela denuncia.
 *
 * Índices das opções: 0 é o placeholder — ele é opção de verdade, porque é a
 * única forma de voltar a "nada escolhido" depois de escolher algo.
 *   0 Selecione a área · 1 Administração · 2 Ciências · 3 Comunicação · 4 Tecnologia
 */

const OPCOES = [
  { id: 1, name: 'Administração' },
  { id: 2, name: 'Ciências' },
  { id: 3, name: 'Comunicação' },
  { id: 4, name: 'Tecnologia' },
];

function montar({ value = '', disabled = false } = {}) {
  const onChange = vi.fn();
  render(
    <SelectField
      id="area"
      label="Área de atuação"
      value={value}
      onChange={onChange}
      options={OPCOES}
      placeholder="Selecione a área"
      disabled={disabled}
    />,
  );
  return {
    user: userEvent.setup(),
    onChange,
    trigger: screen.getByRole('combobox'),
  };
}

const opcoes = () => within(screen.getByRole('listbox')).getAllByRole('option');

describe('SelectField', () => {
  it('começa fechado e anuncia o estado no gatilho', () => {
    const { trigger } = montar();

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).not.toHaveAttribute('aria-activedescendant');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('abre com seta para baixo ancorada na opção já escolhida', async () => {
    const { user, trigger } = montar({ value: '2' });
    trigger.focus();

    await user.keyboard('{ArrowDown}');

    const itens = opcoes();
    expect(itens).toHaveLength(5);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant', itens[2].id);
    expect(itens[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('confirma a opção ativa com Enter e fecha a lista', async () => {
    const { user, onChange, trigger } = montar();
    trigger.focus();

    // O primeiro ArrowDown abre no índice 0; o segundo desce para 1.
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('1');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Esc fecha sem escolher e o foco continua no gatilho', async () => {
    const { user, onChange, trigger } = montar();
    trigger.focus();

    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
    // O foco nunca saiu daqui: é o ponto do padrão "select-only" do APG.
    expect(trigger).toHaveFocus();
  });

  it('Home e End saltam para as pontas da lista', async () => {
    const { user, trigger } = montar({ value: '2' });
    trigger.focus();

    await user.keyboard('{End}');
    expect(trigger).toHaveAttribute('aria-activedescendant', opcoes()[4].id);

    await user.keyboard('{Home}');
    expect(trigger).toHaveAttribute('aria-activedescendant', opcoes()[0].id);
  });

  it('busca por digitação abre e move a opção ativa', async () => {
    const { user, trigger } = montar();
    trigger.focus();

    await user.keyboard('t');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant', opcoes()[4].id);
  });

  it('digitar mais letras refina entre opções de mesma inicial', async () => {
    const { user, trigger } = montar();
    trigger.focus();

    // "c" pega Ciências (2); "co" precisa avançar para Comunicação (3).
    await user.keyboard('c');
    expect(trigger).toHaveAttribute('aria-activedescendant', opcoes()[2].id);

    await user.keyboard('o');
    expect(trigger).toHaveAttribute('aria-activedescendant', opcoes()[3].id);
  });

  it('Tab confirma a opção ativa e libera o foco', async () => {
    const { user, onChange, trigger } = montar();
    trigger.focus();

    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith('1');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger).not.toHaveFocus();
  });

  it('escolhe pelo ponteiro e devolve o foco ao gatilho', async () => {
    const { user, onChange, trigger } = montar();

    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Tecnologia' }));

    expect(onChange).toHaveBeenCalledWith('4');
    expect(trigger).toHaveFocus();
  });

  it('o placeholder é opção de verdade, para desfazer a escolha', async () => {
    const { user, onChange, trigger } = montar({ value: '2' });

    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Selecione a área' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('não abre quando desabilitado', async () => {
    const { user, trigger } = montar({ disabled: true });

    await user.click(trigger);

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
