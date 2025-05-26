import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Product {
    id: number;
    name: string;
    image: string;
    thumbnail: string;
    price: string;
}

export default function ProductScreen() {
    const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string, categoryName: string }>();
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`http://localhost:8000/api/user/categories/${categoryName}/products`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log('Productos recibidos:', response.data.products);
                setProducts(response.data.products);
            } catch (error) {
                console.error('Error al obtener productos:', error);
            }
        };

        if (categoryId && categoryName) {
            fetchProducts();
        }
    }, [categoryId, categoryName]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Productos de la categoría: {categoryName}</Text>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.productCard}>
                        <Image
                            source={{ uri: `http://localhost:8000/storage/${item.thumbnail}` }}
                            style={styles.productImage}
                        />
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productPrice}>${item.price}</Text>
                    </View>
                )}
                numColumns={2}
                contentContainerStyle={styles.productList}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    productList: {
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    productImage: {
        width: 100,
        height: 100,
        marginBottom: 8,
    },
    productName: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    productPrice: {
        color: 'green',
    },
});