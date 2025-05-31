import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';

import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../constants/config';


const API_URL = 'http://localhost:8000/api/user/login'; // Usa tu IP local si estás en desarrollo

const LoginScreen = () => {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  // const [token, setToken] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, {
        email,
        password
      });

      console.log('Respuesta de la API:', response.data); // Verificar la respuesta

      // Aquí guardas el token JWT y el nombre del usuario
      const accessToken = response.data.token;
      const userName = response.data.user.name; // Asegúrate de que tu API devuelva el nombre
      // setToken(accessToken);
      setError('');
      console.log('Login exitoso', accessToken);
      console.log('Nombre de usuario:', userName);

      if (accessToken) {
        await AsyncStorage.setItem('token', accessToken);
        await AsyncStorage.setItem('userName', userName);
        console.log('Token y nombre guardados en AsyncStorage');
        router.replace('/(tabs)'); // Redirige al index de (tabs)
      } else {
        console.error('No se pudo obtener el token');
        setError('Error al obtener el token');
      }
    } catch (err: any) {
      console.error('Error en el inicio de sesión:', err);
      setError('Credenciales inválidas o error de conexión');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <Link href="/register">
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D1D9E6',
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  error: {
    color: '#FF4C4C',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkText: {
    color: '#007bff',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default LoginScreen;