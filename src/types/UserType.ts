import { type DataBank } from '../types/BankDataType';

export interface User {
    idUserAccount: string;
    name: string;
    email: string;
    password: string;
    banks: DataBank[];
}