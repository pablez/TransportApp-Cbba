import React from 'react';
import HeaderWithDrawer from '../HeaderWithDrawer';
import { ROUTE_INFO } from '../../data/routes';

interface AdminHeaderProps {
  currentRoute?: string | null;
  onCloseRoute?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ currentRoute }) => {
  const getHeaderTitle = () => {
    if (currentRoute && (ROUTE_INFO as any)[currentRoute]) {
      return `🚌 ${(ROUTE_INFO as any)[currentRoute].name}`;
    }
    return '📍 Mapa';
  };

  const subtitle = currentRoute && (ROUTE_INFO as any)[currentRoute] ? 'Ruta activa' : '';

  return <HeaderWithDrawer title={getHeaderTitle()} subtitle={subtitle} />;
};

export default AdminHeader;
