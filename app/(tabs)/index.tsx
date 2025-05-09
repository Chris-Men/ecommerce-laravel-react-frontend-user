import React, { useEffect, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userName'); // Eliminar el nombre del usuario al cerrar sesión
    router.replace('/login'); // Vuelve a la pantalla de login
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) {
        setUserName(name);
      } else {
        console.log('No se encontró el nombre del usuario en AsyncStorage'); // Ayuda a depurar
      }
    };
    fetchUserName();
  }, []);

  return (
    // Contenedor principal
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        {/* Navbar */}
        <ThemedView style={styles.navbar}>
          <Link href="/admins"><ThemedText style={styles.linkText}>Admins</ThemedText></Link>
          <Link href="/brands"><ThemedText style={styles.linkText}>Brands</ThemedText></Link>
          <Link href="/categories"><ThemedText style={styles.linkText}>Categories</ThemedText></Link>
          <Link href="/colors"><ThemedText style={styles.linkText}>Colors</ThemedText></Link>
          <Link href="/coupons"><ThemedText style={styles.linkText}>Coupons</ThemedText></Link>
          <Link href="/orders"><ThemedText style={styles.linkText}>Orders</ThemedText></Link>
          <Link href="/products"><ThemedText style={styles.linkText}>Products</ThemedText></Link>
          <Link href="/reviews"><ThemedText style={styles.linkText}>Reviews</ThemedText></Link>
          <Link href="/sizes"><ThemedText style={styles.linkText}>Sizes</ThemedText></Link>
          <Link href="/users"><ThemedText style={styles.linkText}>Users</ThemedText></Link>
        </ThemedView>
      </ThemedView>
      <ThemedText type="title">¡Bienvenido {userName}!</ThemedText>

      {/* Botón de logout */}
      <ThemedView style={{ marginVertical: 20 }}>
        <Button title="Cerrar sesión" onPress={handleLogout} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'dark',
    zIndex: 1000,
    paddingVertical: 10,
  },
  navbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  linkText: {
    padding: 10,
    fontSize: 16,
    color: '#007bff',
  },
});