import { type AddressModelData } from "../types/AddressUserType.ts";


// api via cep
// chamada api via cep
export async function getAddressByCep(cep: string): Promise<AddressModelData> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

  if (!response.ok) throw new Error("Erro ao buscar endereço");

  const data = await response.json();

  if (data.erro) throw new Error("CEP não encontrado");

  return data;
}

