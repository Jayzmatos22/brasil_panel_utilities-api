import { Database } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { type User } from "../types/UserType";

export default function RegisterData() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    {
      /* VALIDAÇÕES DE CREDENCIAIS */
    }

    const validEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const validName = /^[a-zA-ZÀ-ÿ]{2,}(?:\s[a-zA-ZÀ-ÿ]+)+$/;
    const valiPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (
      !validEmail.test(email) &&
      !validName.test(name) &&
      !valiPassword.test(password)
    ) {
      toast.error("Campos inválidos");
      return;
    }

    if (!validEmail.test(email)) {
      toast.error("Formato e e-mail inválido!");
      return;
    }

    if (!validName.test(name)) {
      toast.error("Digite seu nome completo");
      return;
    }

    if (!valiPassword.test(password)) {
      toast.error("Digite uma senha forte!");
      return;
    }

    // Banco de dados.
    const savedUsers: User[] = JSON.parse(
      localStorage.getItem("db_users") || "[]",
    );

    const existEmail = savedUsers.some(
      (existUser) => existUser.email === email,
    );

    // Email existente
    if (existEmail) {
      toast.error("Este e-mail já está cadastrado em nosso sistema!");
      return;
    }

    const newUser: User = {
      idUserAccount: crypto.randomUUID(),
      name: name,
      email: email,
      password: password,
      address: {
        cep: "",
        logradouro: "",
        complemento: "",
        unidade: "",
        bairro: "",
        localidade: "",
        uf: "",
        estado: "",
        regiao: "",
        ibge: "",
        gia: "",
        ddd: "",
        siafi: "",
      },
      bank: {
        idAccount: crypto.randomUUID(),
        holder: name,
        agency: "",
        numberAccount: "",
        balance: 0,
        status: "DESATIVADA",
        card: {
          cardNumber: "",
          cardholderName: name,
          expirationDate: "",
          cvv: "",
          type: "NAO-INFORMADO",
        },
      },
    };

    savedUsers.push(newUser);
    localStorage.setItem("db_users", JSON.stringify(savedUsers));

    toast.success("Cadastro validado com sucesso!");

    setName("");
    setEmail("");
    setPassword("");
    setTimeout(() => {
      navigate("/login-usuario", { replace: true });
    }, 1500);
  };

  return (
    <form
      onSubmit={handleRegister}
      className="border-gray-500 border w-full max-w-md min-h-112.5 shadow-2xl flex flex-col p-10 rounded-xl bg-slate-900"
    >
      <div className="w-full flex items-center justify-center text-center mb-10">
        <h2 className="text-white register-font text-2xl flex items-center gap-3 tracking-wider">
          <Database size={28} className="database-icon" />
          Dados de Cadastro
        </h2>
      </div>

      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-white text-sm ml-1">Nome Completo</label>
          <input
            className="w-full h-12 p-3 rounded-md bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
            type="text"
            placeholder="Ex: nome sobrenome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white text-sm ml-1">Seu e-mail</label>
          <input
            className="w-full h-12 p-3 rounded-md bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white text-sm ml-1">Criar senha</label>
          <input
            className="w-full h-12 p-3 rounded-md bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
            type="password"
            placeholder="***********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 mt-4 bg-yellow-500 hover:bg-yellow-800 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95"
        >
          Cadastrar
        </button>

        <button
          onClick={() => navigate("/login-usuario")}
          className="w-full h-12 bg-red-500 hover:bg-red-950 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95"
        >
          Já tem conta?
        </button>
      </div>
    </form>
  );
}
