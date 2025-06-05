import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type Coupon = {
  id: number;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number | null;
  valid_until: string;
  created_at: string;
  is_active: boolean;
};

const API_URL = 'http://localhost:8000/api';

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener cupones desde la API
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al obtener cupones');

      // Debug: verificar datos recibidos
      console.log('Datos recibidos de la API:', data);
      
      // Verificar cada cupón y filtrar datos inválidos
      const validCoupons = data.coupons.filter((coupon: any, index: number) => {
        if (!coupon || typeof coupon !== 'object') {
          console.warn(`Cupón ${index} es inválido:`, coupon);
          return false;
        }
        
        if (coupon.discount_value === undefined || coupon.discount_value === null) {
          console.warn(`Cupón ${index} tiene discount_value inválido:`, coupon);
          // Asignar valor por defecto
          coupon.discount_value = 0;
        }
        
        return true;
      });

      // Ordenar por fecha más reciente
      const sortedCoupons = validCoupons.sort((a: Coupon, b: Coupon) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setCoupons(sortedCoupons);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', dateString);
      return 'Fecha inválida';
    }
  };

  // Verificar si el cupón está vencido
  const isExpired = (validUntil: string) => {
    if (!validUntil) return true;
    try {
      return new Date(validUntil) < new Date();
    } catch (error) {
      console.warn('Error al verificar vencimiento:', validUntil);
      return true;
    }
  };

  // Formatear descuento
  const formatDiscount = (type: string, value: number | null | undefined) => {
    // Verificar que type sea válido
    if (type !== 'percentage' && type !== 'fixed') {
      console.warn('Tipo de descuento inválido:', type);
      return 'Descuento inválido';
    }
    
    // Convertir value a número y validar
    const numValue = Number(value);
    if (isNaN(numValue) || value === undefined || value === null) {
      console.warn('Valor de descuento inválido:', value);
      return type === 'percentage' ? '0%' : '$0.00';
    }
    
    // Validar rangos lógicos
    if (type === 'percentage' && (numValue < 0 || numValue > 100)) {
      console.warn('Porcentaje fuera de rango válido (0-100):', numValue);
    }
    
    if (type === 'fixed' && numValue < 0) {
      console.warn('Monto fijo negativo:', numValue);
    }
    
    return type === 'percentage' ? `${numValue}%` : `$${numValue.toFixed(2)}`;
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.welcomeText}>🎫 Cupones de Descuento</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4e8cff" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={coupons}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay cupones disponibles</Text>
              </View>
            }
            renderItem={({ item }) => {
              // Validar que el item tenga las propiedades necesarias
              if (!item || typeof item !== 'object') {
                console.warn('Item inválido en renderItem:', item);
                return null;
              }

              // Validar propiedades críticas
              const hasValidDiscount = item.discount_type && item.discount_value !== undefined;
              const hasValidDates = item.valid_until && item.created_at;
              
              if (!hasValidDiscount || !hasValidDates) {
                console.warn('Item con datos incompletos:', item);
              }

              return (
                <View style={[
                  styles.couponCard,
                  isExpired(item.valid_until || '') && styles.expiredCard
                ]}>
                  <View style={styles.couponHeader}>
                    <View style={styles.couponInfo}>
                      <Text style={styles.couponName}>{item.name || 'Cupón sin nombre'}</Text>
                      <Text style={styles.couponDiscount}>
                        {formatDiscount(item.discount_type || 'percentage', item.discount_value)} de descuento
                      </Text>
                    </View>
                    <View style={styles.couponStatus}>
                      <View style={[
                        styles.statusBadge,
                        isExpired(item.valid_until || '') ? styles.expiredBadge : styles.activeBadge
                      ]}>
                        <Text style={[
                          styles.statusText,
                          isExpired(item.valid_until || '') ? styles.expiredText : styles.activeText
                        ]}>
                          {isExpired(item.valid_until || '') ? 'VENCIDO' : 'ACTIVO'}
                        </Text>
                      </View>
                      <Text style={styles.expiryDate}>
                        Vence: {formatDate(item.valid_until || '')}
                      </Text>
                    </View>
                  </View>
                  
                  {item.description && (
                    <Text style={styles.couponDescription}>{item.description}</Text>
                  )}
                  
                  <Text style={styles.createdDate}>
                    Creado: {formatDate(item.created_at || '')}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
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
  couponCard: {
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
  expiredCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponInfo: {
    flex: 1,
  },
  couponName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  couponDiscount: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  couponStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  expiredBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#155724',
  },
  expiredText: {
    color: '#721c24',
  },
  expiryDate: {
    fontSize: 12,
    color: '#888',
  },
  couponDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});