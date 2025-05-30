import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/config';

const REGISTER_URL = `${API_BASE_URL}/user/register`;
const LOGIN_URL = `${API_BASE_URL}/user/login`;

const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleRegister = async () => {
        try {
            // Paso 1: Registrar usuario
            await axios.post(REGISTER_URL, {
                name,
                email,
                password,
                password_confirmation: password,
            });

            console.log('Usuario registrado correctamente. Iniciando sesión...');

            // Paso 2: Login automático
            const loginResponse = await axios.post(LOGIN_URL, {
                email,
                password,
            });

            const { token, user } = loginResponse.data; // Cambiado a token

            // Paso 3: Guardar token y datos del usuario
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userName', user.name);

            setError('');
            setSuccess('Registro y login exitosos');

            // Paso 4: Redirigir a pantalla principal
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error('Error:', err.response ? err.response.data : err.message);
            setError('Error al registrar o iniciar sesión. Verifica los datos o si el correo ya está en uso.');
            setSuccess('');
        }
    };

    const goToLogin = () => {
        router.replace('/login'); // Cambia '/login' a la ruta de tu pantalla de login
    };

    return (
        <View style={styles.container}>
            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre"
                style={styles.input}
            />
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo"
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
            <Button title="Registrarse" onPress={handleRegister} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}
            <Button title="Regresar al Login" onPress={goToLogin} /> {/* Botón para regresar */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        justifyContent: 'center',
        flex: 1,
        backgroundColor: '#fff'
    },
    input: {
        borderBottomWidth: 1,
        marginBottom: 15,
        fontSize: 16,
        color: '#000'
    },
    error: {
        color: 'red',
        marginTop: 10
    },
    success: {
        color: 'green',
        marginTop: 10
    }
});

export default RegisterScreen;