import React, { createContext, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PRIMARY } from './config';
import { useAuth } from './auth';

const DrawerContext = createContext(null);

export function DrawerProvider({ children }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  return useContext(DrawerContext);
}

export function Hamburger() {
  const drawer = useDrawer();
  return (
    <Pressable onPress={() => drawer?.setOpen(true)} style={{ paddingHorizontal: 12 }}>
      <Text style={{ fontSize: 22, color: PRIMARY }}>☰</Text>
    </Pressable>
  );
}

export function AppDrawer() {
  const drawer = useDrawer();
  const nav = useNavigation();
  const { user, logout } = useAuth();
  if (!drawer?.open) return null;

  const go = (name) => {
    drawer.setOpen(false);
    nav.navigate(name);
  };

  const perms = user?.permissions || {};
  const items = [
    { name: 'Home', label: 'Dashboard', show: true },
    { name: 'Categories', label: 'Categories', show: !!perms.category?.view || !!perms.product?.view },
    { name: 'Processing', label: 'Image Processing', show: !!perms.processing?.view || true },
    { name: 'Shortlist', label: 'Shortlist', show: true },
    { name: 'Profile', label: 'Profile', show: true },
  ].filter((i) => i.show);

  return (
    <Modal transparent animationType="fade" visible={drawer.open} onRequestClose={() => drawer.setOpen(false)}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.35)' }}>
        <View style={{ width: 280, backgroundColor: 'white', paddingTop: 56, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: PRIMARY, marginBottom: 20 }}>Image Process</Text>
          {items.map((item) => (
            <Pressable key={item.name} onPress={() => go(item.name)} style={{ paddingVertical: 14 }}>
              <Text style={{ fontSize: 16 }}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => { drawer.setOpen(false); logout(); }} style={{ paddingVertical: 14 }}>
            <Text style={{ color: '#e11d48' }}>Logout</Text>
          </Pressable>
        </View>
        <Pressable style={{ flex: 1 }} onPress={() => drawer.setOpen(false)} />
      </View>
    </Modal>
  );
}
