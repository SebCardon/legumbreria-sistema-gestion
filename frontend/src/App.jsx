import { useState } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage'
import Sidebar from './components/Sidebar';
import PersonasPage from './pages/PersonasPage';
import ProductosPage from './pages/ProductosPage';
import ProveedorPage from './pages/ProveedorPage';
import CategoriaPage from './pages/CategoriaPage';
import PresentacionPage from './pages/PresentacionPage';
import TipoDocumentoPage from './pages/TipoDocumentoPage';
import RolPage from './pages/RolPage';
import EstadoPage from './pages/EstadoPage';
import TransportePage from './pages/TransportePage';
import CompraPage from './pages/CompraPage';
import FacturaPage from './pages/FacturaPage';
import ProductosXCompraPage from './pages/ProductosXCompraPage';
import ProductosXFacturaPage from './pages/ProductosXFacturaPage';
import NuevaFacturaPage from './pages/NuevaFacturaPage';
import NuevaCompraPage from './pages/NuevaCompraPage'
import NuevoAbonoPage from './pages/NuevoAbonoPage';

const PAGINAS = {
    nuevaFactura: NuevaFacturaPage,
    nuevaCompra: NuevaCompraPage,
    nuevoAbono: NuevoAbonoPage,
    facturas: FacturaPage,
    compras: CompraPage,
    transporte: TransportePage,
    productosXCompra: ProductosXCompraPage,
    productosXFactura: ProductosXFacturaPage,
    personas: PersonasPage,
    productos: ProductosPage,
    proveedores: ProveedorPage,
    categorias: CategoriaPage,
    presentaciones: PresentacionPage,
    tiposDocumento: TipoDocumentoPage,
    roles: RolPage,
    estados: EstadoPage
};

function App() {
    const { estaAutenticado, usuario, logout } = useAuth();
    const [paginaActiva, setPaginaActiva] = useState('nuevaFactura');

    if (!estaAutenticado) {
        return <LoginPage />;
    }

    const PaginaActual = PAGINAS[paginaActiva];

    return (
        <div className="app-layout">
            <Sidebar
                paginaActiva={paginaActiva}
                onCambiarPagina={setPaginaActiva}
                usuario={usuario}
                onLogout={logout}
            />
            <main className="content">
                <PaginaActual />
            </main>
        </div>
    );
}

export default App;