import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { PRIMARY } from '../config';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');

  const save = async () => {
    try {
      await api.updateProfile(token, {
        name,
        ...(password ? { password, current_password: current } : {}),
      });
      Alert.alert('Saved');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ marginBottom: 8 }}>{user?.email} · {user?.role}</Text>
      <TextInput value={name} onChangeText={setName} style={input} />
      <TextInput value={current} onChangeText={setCurrent} placeholder="Current password" secureTextEntry style={input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="New password" secureTextEntry style={input} />
      <Pressable onPress={save} style={{ backgroundColor: PRIMARY, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: 'white' }}>Update profile</Text>
      </Pressable>
      <Pressable onPress={logout}><Text style={{ color: PRIMARY }}>Logout</Text></Pressable>
    </View>
  );
}

const input = { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 10 };
