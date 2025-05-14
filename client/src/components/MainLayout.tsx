import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Truck, Route, Info, LogOut } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-primary mr-2" />
            <h1 className="text-lg font-semibold text-primary-800">iTrack</h1>
          </div>
          
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link 
                  href="/transport" 
                  className={`flex items-center ${location === "/transport" ? "text-primary font-medium" : "text-secondary-600 hover:text-secondary-800 font-medium"}`}
                >
                  <Route className="h-4 w-4 mr-1" />
                  <span>Transport</span>
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => {
                    try {
                      const dialog = document.getElementById('aboutDialog');
                      if (dialog && 'showModal' in dialog) {
                        (dialog as HTMLDialogElement).showModal();
                      } else {
                        console.error("Elementul dialog nu are metoda showModal");
                      }
                    } catch (error) {
                      console.error("Eroare la deschiderea dialogului:", error);
                    }
                  }}
                  className="flex items-center text-secondary-600 hover:text-secondary-800 font-medium"
                >
                  <Info className="h-4 w-4 mr-1" />
                  <span>Despre</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={logout} 
                  className="flex items-center text-secondary-600 hover:text-secondary-800 font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Ieșire</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
