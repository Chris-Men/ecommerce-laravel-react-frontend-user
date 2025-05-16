import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Definición de la interfaz Product
interface Product {
    id: number;
    name: string;
    slug: string;
    qty: number;
    price: number;
    description: string;
    thumbnail?: string; // Opcional
}

export default function Products() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true); // Estado de carga

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

        const fetchProducts = async () => {
            try {
                const token = await AsyncStorage.getItem('token'); // Obtener el token
                console.log('Token recuperado:', token); // Verifica que el token no sea null o undefined

                if (!token) {
                    console.error('Token no disponible, redirigiendo a login');
                    router.replace('/login'); // Redirige si no hay token
                    return;
                }

                const response = await axios.get('http://localhost:8000/api/products', {
                    headers: {
                        Authorization: `Bearer ${token}`, // Asegúrate de que el token sea válido
                    },
                });
                setProducts(response.data);
            } catch (error) {
                console.error('Error al obtener productos:', error);
            } finally {
                setLoading(false); // Cambia el estado de carga a false al finalizar la carga
            }
        };

        fetchUserName();
        fetchProducts();
    }, [router]);

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Cargando productos...</Text>
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.header}>
                {/* Navbar */}
                <ThemedView style={styles.navbar}>
                    <ThemedText type="title" style={styles.welcomeText}>
                        ¡Bienvenido {userName}!
                    </ThemedText>
                    <Link href="/brands"><ThemedText style={styles.linkText}>Brands</ThemedText></Link>
                    <Link href="/categories"><ThemedText style={styles.linkText}>Categories</ThemedText></Link>
                    <Link href="/colors"><ThemedText style={styles.linkText}>Colors</ThemedText></Link>
                    <Link href="/coupons"><ThemedText style={styles.linkText}>Coupons</ThemedText></Link>
                    <Link href="/orders"><ThemedText style={styles.linkText}>Orders</ThemedText></Link>
                    <Link href="/products"><ThemedText style={styles.linkText}>Products</ThemedText></Link>
                    <Link href="/reviews"><ThemedText style={styles.linkText}>Reviews</ThemedText></Link>
                    <Link href="/sizes"><ThemedText style={styles.linkText}>Sizes</ThemedText></Link>
                    <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                        <Text style={styles.menuButtonText}>☰</Text>
                    </TouchableOpacity>
                    {menuVisible && (
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
                                <Text style={styles.menuItemText}>Cerrar sesión</Text>
                            </TouchableOpacity>
                            {/* Puedes agregar más opciones aquí */}
                            <TouchableOpacity style={styles.menuItem}>
                                <Text style={styles.menuItemText}>Otra Opción</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ThemedView>
            </ThemedView>

            <ThemedView style={{ marginVertical: 20 }}>
                {/* Aquí puedes agregar más contenido si es necesario */}
            </ThemedView>

            {/* Lista de productos */}
            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.productCard}>
                        <Image
                            source={{ uri: item.thumbnail }} // Asegúrate de que 'thumbnail' sea la URL de la imagen
                            style={styles.productImage} // Define un estilo para la imagen
                            resizeMode="contain" // Ajusta el modo de visualización según tus necesidades
                        />
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>${item.price}</Text>
                        <Text style={styles.productDescription}>{item.description}</Text>
                    </View>
                )}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        alignItems: 'center',
    },
    welcomeText: {
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
        color: '#fff',
    },
    menuButton: {
        padding: 10,
    },
    menuButtonText: {
        color: '#fff',
        fontSize: 24,
    },
    dropdownMenu: {
        position: 'absolute',
        right: 0,
        top: 40,
        backgroundColor: 'white',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        padding: 10,
    },
    menuItemText: {
        color: '#000',
    },
    productCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginVertical: 10,
        borderRadius: 5,
        width: '100%',
    },
    productImage: {
        width: '100%', // Ajusta el ancho según sea necesario
        height: 200, // Ajusta la altura según sea necesario
        borderRadius: 5, // Opcional, para bordes redondeados
        marginBottom: 10, // Espacio entre la imagen y el texto
    },
    productName: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    productPrice: {
        color: 'green',
        fontSize: 16,
    },
    productDescription: {
        color: '#555',
    },
    linkText: {
        padding: 10,
        fontSize: 16,
        color: '#007bff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});