import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetailScreen() {
    const { id, name, thumbnail, brand, size, color, qty, price } = useLocalSearchParams();
    const [quantity, setQuantity] = useState('1');

    const handleAddToCart = () => {
        if (Number(quantity) > Number(qty)) {
            Alert.alert('Cantidad no disponible', `Solo hay ${qty} en inventario`);
            return;
        }

        // Aquí puedes manejar la lógica para agregar al carrito
        Alert.alert('Agregado al carrito', `${name} x ${quantity}`);
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: `http://localhost:8000/storage/${thumbnail}` }} style={styles.image} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.detail}>Marca: {brand}</Text>
            <Text style={styles.detail}>Talla: {size}</Text>
            <Text style={styles.detail}>Color: {color}</Text>
            <Text style={styles.detail}>Disponibles: {qty}</Text>
            <Text style={styles.detail}>Precio: ${price}</Text>

            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Cantidad"
            />

            <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
                <Text style={styles.buttonText}>Agregar al carrito</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flex: 1,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    detail: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
        marginBottom: 20,
        width: '40%',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});