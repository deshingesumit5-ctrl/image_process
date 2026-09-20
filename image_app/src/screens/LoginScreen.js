import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { API_URL, PRIMARY } from '../config';
import { useAuth } from '../auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('sales@image.test');
  const [password, setPassword] = useState('password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    try {
      setBusy(true);
      setError('');
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF2FF', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: PRIMARY }}>Image Process</Text>
      <Text style={{ marginBottom: 24, color: '#64748b' }}>Sign in to browse, process, and share</Text>
      {error ? (
        <Text style={{ color: '#be123c', marginBottom: 12 }}>{error}</Text>
      ) : null}
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" style={input} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" style={input} />
      <Pressable onPress={onSubmit} disabled={busy} style={{ backgroundColor: PRIMARY, borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: '600' }}>{busy ? 'Signing in…' : 'Login'}</Text>
      </Pressable>
      <Text style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>API {API_URL}</Text>
    </View>
  );
}

const input = { backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 12 };
