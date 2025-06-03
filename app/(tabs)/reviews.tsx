import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type Review = {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string | null;
  title: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
  product?: {
    name: string;
  };
};

type Product = {
  id: number;
  name: string;
  price?: number;
};

const API_URL = 'http://localhost:8000/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form data
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const showSuccessMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Obtener reseñas desde la API
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al obtener reseñas');

      // Ordenar por fecha más reciente
      const sortedReviews = data.data.sort((a: Review, b: Review) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setReviews(sortedReviews);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener productos para el selector
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al obtener productos');

      setProducts(data.products || data.data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Crear nueva reseña
  const handleSubmit = async () => {
    if (!selectedProductId) {
      return Alert.alert('Validación', 'Selecciona un producto.');
    }
    if (rating < 1 || rating > 5) {
      return Alert.alert('Validación', 'La calificación debe estar entre 1 y 5.');
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedProductId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showSuccessMessage('Reseña creada correctamente.');
        
        // Limpiar formulario
        setSelectedProductId(null);
        setRating(5);
        setTitle('');
        setComment('');
        setModalVisible(false);
        
        // Recargar reseñas
        fetchReviews();
      } else {
        Alert.alert('Error', data.error || data.message || 'Error al crear reseña');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la reseña');
    }
  };

  // Renderizar estrellas
  const renderStars = (rating: number, onPress?: (rating: number) => void, size: number = 18) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Text style={[
              styles.star,
              { 
                color: star <= rating ? '#FFD700' : '#DDD',
                fontSize: size
              }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>⭐ Reseñas de Productos</Text>

        {successMessage && (
          <View style={styles.successMessageContainer}>
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.addButton]}
          onPress={() => {
            setSelectedProductId(null);
            setRating(5);
            setTitle('');
            setComment('');
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Nueva Reseña</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#4e8cff" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay reseñas disponibles</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {item.product?.name || `Producto #${item.product_id}`}
                    </Text>
                    <Text style={styles.userName}>
                      Por {item.user?.name || 'Usuario'}
                    </Text>
                  </View>
                  <View style={styles.ratingDate}>
                    {renderStars(item.rating)}
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
                
                {item.title && (
                  <Text style={styles.reviewTitle}>{item.title}</Text>
                )}
                
                {item.comment && (
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                )}
              </View>
            )}
          />
        )}

        {/* Modal para crear nueva reseña */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Nueva Reseña</Text>
                
                <Text style={styles.label}>Producto *</Text>
                {loadingProducts ? (
                  <ActivityIndicator color="#4e8cff" style={{ margin: 20 }} />
                ) : (
                  <View style={styles.pickerContainer}>
                    <ScrollView style={styles.productList} nestedScrollEnabled>
                      {products.map((product) => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            styles.productOption,
                            selectedProductId === product.id && styles.selectedProduct
                          ]}
                          onPress={() => setSelectedProductId(product.id)}
                        >
                          <Text style={[
                            styles.productOptionText,
                            selectedProductId === product.id && styles.selectedProductText
                          ]}>
                            {product.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Text style={[styles.label, { marginTop: 20 }]}>Calificación *</Text>
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                  {renderStars(rating, setRating, 24)}
                </View>

                <Text style={[styles.label, { marginTop: 20 }]}>Título (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Título de tu reseña"
                  maxLength={255}
                />

                <Text style={[styles.label, { marginTop: 20 }]}>Comentario (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Comparte tu experiencia con este producto..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>Crear Reseña</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  successMessageContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  successMessageText: {
    color: '#155724',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4e8cff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#666',
  },
  ratingDate: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    marginHorizontal: 1,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 120,
  },
  productList: {
    maxHeight: 120,
  },
  productOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedProduct: {
    backgroundColor: '#e3f2fd',
  },
  productOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedProductText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4e8cff',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});