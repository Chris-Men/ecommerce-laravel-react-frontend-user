// LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';

import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'http://localhost:8000/api/admin/login'; // Usa tu IP local si estás en desarrollo

const LoginScreen = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, {
        email,
        password
      });

      console.log('Respuesta de la API:', response.data); // Verificar la respuesta

      // Aquí guardas el token JWT y el nombre del usuario
      const accessToken = response.data.access_token;
      const userName = response.data.name; // Asegúrate de que tu API devuelva el nombre
      setToken(accessToken);
      setError('');
      console.log('Login exitoso', accessToken);

      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('userName', userName); // Guardar el nombre del usuario
      router.replace('/(tabs)'); // Redirige al index de (tabs)
    } catch (err: any) {
      console.error(err);
      setError('Credenciales inválidas o error de conexión');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
      />
      <Button title="Iniciar sesión" onPress={handleLogin} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {token ? <Text style={styles.token}>Token: {token}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fondo blanco
    padding: 20
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    fontSize: 16,
    color: '#000000', // Texto negro
  },
  error: {
    color: 'red',
    marginTop: 10
  },
  token: {
    marginTop: 10,
    color: 'green'
  },
});

export default LoginScreen;