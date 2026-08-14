import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE_FORM, formToRequest, profileToForm } from './profileForm';
import type { ProfileResponse } from '../../types/ProfileType';

/**
 * A ponte entre o formulário (tudo string, porque é o que `<select>` e `<input>`
 * manipulam) e a API (números e nulls). É onde uma escolha vazia vira `null` em
 * vez de `0` ou `""` — e onde o backend recusaria o payload se a conversão
 * escorregasse.
 */

const REF = (id: number, slug: string, name: string) => ({ id, slug, name });

const PERFIL_COMPLETO: ProfileResponse = {
  professionArea:    REF(1, 'tecnologia', 'Tecnologia'),
  professionSubarea: REF(10, 'backend', 'Back-end'),
  professionLevel:   REF(100, 'pleno', 'Pleno'),
  professionTitle:   'Analista de dados',
  educationArea:     REF(1, 'tecnologia', 'Tecnologia'),
  educationSubarea:  null,
  educationLevel:    REF(200, 'superior', 'Ensino Superior'),
  institution:       'UFBA',
  updatedAt:         '2026-08-14T19:03:11.482',
};

const PERFIL_VAZIO: ProfileResponse = {
  professionArea: null,
  professionSubarea: null,
  professionLevel: null,
  professionTitle: null,
  educationArea: null,
  educationSubarea: null,
  educationLevel: null,
  institution: null,
  updatedAt: null,
};

describe('conversão do formulário de perfil', () => {
  describe('profileToForm', () => {
    it('converte referências em ids string, que é o que o select compara', () => {
      const form = profileToForm(PERFIL_COMPLETO);

      // Number aqui faria o `value` do <option> nunca casar com o do <select>,
      // e o campo abriria em branco mesmo com perfil preenchido.
      expect(form.professionAreaId).toBe('1');
      expect(form.professionSubareaId).toBe('10');
      expect(form.educationLevelId).toBe('200');
      expect(form.professionTitle).toBe('Analista de dados');
    });

    it('perfil vazio vira formulário vazio, sem undefined ou "null"', () => {
      // undefined tornaria o input não-controlado; a string "null" apareceria
      // escrita na tela.
      expect(profileToForm(PERFIL_VAZIO)).toEqual(EMPTY_PROFILE_FORM);
    });

    it('campo ausente isolado não contamina os demais', () => {
      const form = profileToForm({ ...PERFIL_COMPLETO, professionSubarea: null });

      expect(form.professionSubareaId).toBe('');
      expect(form.professionAreaId).toBe('1');
    });
  });

  describe('formToRequest', () => {
    it('seleção vazia vira null, não 0', () => {
      const payload = formToRequest(EMPTY_PROFILE_FORM);

      // Number('') é 0, e 0 é um id que o backend procuraria no catálogo e
      // recusaria com 400 — o usuário levaria erro por não ter respondido.
      expect(payload).toEqual({
        professionAreaId: null,
        professionSubareaId: null,
        professionLevelId: null,
        professionTitle: null,
        educationAreaId: null,
        educationSubareaId: null,
        educationLevelId: null,
        institution: null,
      });
    });

    it('ids em string viram número', () => {
      const payload = formToRequest({ ...EMPTY_PROFILE_FORM, professionAreaId: '1', educationLevelId: '200' });

      expect(payload.professionAreaId).toBe(1);
      expect(payload.educationLevelId).toBe(200);
    });

    it('texto só com espaços vira null e o resto é aparado', () => {
      const payload = formToRequest({
        ...EMPTY_PROFILE_FORM,
        professionTitle: '   ',
        institution: '  UFBA  ',
      });

      expect(payload.professionTitle).toBeNull();
      expect(payload.institution).toBe('UFBA');
    });
  });

  it('ida e volta preserva o perfil', () => {
    // profileToForm e formToRequest precisam concordar sobre cada campo; se uma
    // ganhar campo novo e a outra não, o dado some silenciosamente ao editar.
    const payload = formToRequest(profileToForm(PERFIL_COMPLETO));

    expect(payload).toEqual({
      professionAreaId: 1,
      professionSubareaId: 10,
      professionLevelId: 100,
      professionTitle: 'Analista de dados',
      educationAreaId: 1,
      educationSubareaId: null,
      educationLevelId: 200,
      institution: 'UFBA',
    });
  });
});
