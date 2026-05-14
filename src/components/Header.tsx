import { PiggyBank, UserSearch } from 'lucide-react';

export default function HeaderApp(){
    return (
        <header className="border-b border-yellow-200 hover:border-yellow-100 bg-header-app justify-between absolute top-0 bg-purple-900 w-full p-3 flex-row rounded-md flex md:h-20 lg:h-24 items-center">
            
            <div className="flex flex-col">
                <h1 className="antialiased text-3xl font-bold nameApp flex flex-row items-center gap-10">
                    <PiggyBank size={60} className="piggy-bank cursor-pointer hover:scale-110" />
                    Bank Viewer 
                </h1>
                <h2 className="text-sm text-yellow-50 font-semibold antialised mt-1  flex ml-20"> 
                    Access your data in a simple way 
                </h2>
            </div>

            <div className="flex relative text-white">
                <span className="items-center gap-3 flex">
                    Usuário <UserSearch size={30} className="user-icon cursor-pointer hover:scale-110" />
                </span>
            </div>

        </header>
    )
}