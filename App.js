import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Image, TouchableOpacity, Animated, ScrollView } from 'react-native';

// URL de la API
const API_URL = "https://iot-simulator-api.vercel.app/api/sensors";

// Simulador de API para cuando la API real falle
const mockApi = {
  fetchSensorData: async (sensorId) => {
    const now = new Date();
    const hourFactor = Math.sin(now.getHours() / 24 * Math.PI);
    const tempVariation = hourFactor * 8 + (Math.random() * 2 - 1);
    return {
      id: sensorId,
      temperature: (22 + tempVariation).toFixed(1),
      humidity: (50 + hourFactor * 15 + (Math.random() * 5 - 2.5)).toFixed(1),
      location: ["Sala A", "Sala B", "Exterior", "Almacén"][sensorId % 4],
      status: Math.random() > 0.15 ? "OK" : "ALERTA",
      lastUpdated: now.toLocaleTimeString(),
      battery: (85 - sensorId * 3 + Math.random() * 10).toFixed(0),
      co2: (400 + Math.random() * 200).toFixed(0)
    };
  }
};

// Componente del panel de Realidad Aumentada
const ARPanel = ({ data, onClose, loading }) => {
  const [slideAnim] = useState(new Animated.Value(-300)); // Animación de deslizamiento desde la izquierda
  const [pulseAnim] = useState(new Animated.Value(1)); // Animación de pulsación
  const [floatAnim] = useState(new Animated.Value(0)); // Animación de movimiento vertical

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 10,
            duration: 1500,
            useNativeDriver: true
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true
          })
        ])
      )
    ]).start();
  }, []);

  if (!data) return null;

  const statusColor = data.status === "OK" ? "#10B981" : "#EF4444";
  
  return (
    <Animated.View style={[styles.arPanel, { transform: [{ translateX: slideAnim }] }]}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      
      <View style={styles.sensorHeader}>
        <Animated.View style={[styles.sensorIcon, { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] }]}>
          <Text style={styles.sensorIconText}>⚡</Text>
        </Animated.View>
        <Text style={styles.panelTitle}>Sensor #{data.id}</Text>
      </View>
      
      <View style={styles.dataGrid}>
        <View style={styles.dataCell}>
          <Text style={styles.dataLabel}>🔥 Temp</Text>
          <Text style={styles.dataValue}>{data.temperature}°C</Text>
        </View>
        <View style={styles.dataCell}>
          <Text style={styles.dataLabel}>🌊 Hum</Text>
          <Text style={styles.dataValue}>{data.humidity}%</Text>
        </View>
        <View style={styles.dataCell}>
          <Text style={styles.dataLabel}>📍 Loc</Text>
          <Text style={styles.dataValue}>{data.location}</Text>
        </View>
        <View style={styles.dataCell}>
          <Text style={styles.dataLabel}>🔋 Bat</Text>
          <Text style={styles.dataValue}>{data.battery}%</Text>
        </View>
      </View>
      
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{data.status}</Text>
      </View>
      
      <Text style={styles.updateText}>Último: {data.lastUpdated}</Text>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );
};

export default function App() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAR, setShowAR] = useState(false);
  const [currentSensor, setCurrentSensor] = useState(1);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de desvanecimiento
  const [slideLeftAnim] = useState(new Animated.Value(-100)); // Animación de deslizamiento izquierda
  const [slideRightAnim] = useState(new Animated.Value(100)); // Animación de deslizamiento derecha
  const [bounceAnim] = useState(new Animated.Value(0)); // Animación de rebote para botones

  // Función para obtener datos del sensor
  const fetchData = async (sensorId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/${sensorId}`);
      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        data = await mockApi.fetchSensorData(sensorId);
      }
      setSensorData(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error al obtener datos:", err);
      setError("Conexión fallida - Usando datos simulados");
      const data = await mockApi.fetchSensorData(sensorId);
      setSensorData(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  // Animaciones al montar el componente
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.spring(slideLeftAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.spring(slideRightAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  // Actualización automática cada 5 segundos
  useEffect(() => {
    fetchData(currentSensor);
    const interval = setInterval(() => fetchData(currentSensor), 5000);
    return () => clearInterval(interval);
  }, [currentSensor]);

  // Cambiar entre sensores
  const changeSensor = (delta) => {
    const newSensor = currentSensor + delta;
    if (newSensor >= 1 && newSensor <= 8) {
      setCurrentSensor(newSensor);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Panel IoT</Text>
        <Text style={styles.subtitle}>Monitoreo Ambiental</Text>
      </Animated.View>
      
      {loading && !sensorData && (
        <View style={styles.fullLoader}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Cargando sensores...</Text>
        </View>
      )}
      
      {error && (
        <Animated.View style={[styles.errorBox, { opacity: fadeAnim }]}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
      
      {sensorData && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.sensorSelector}>
            <Button 
              title="◄" 
              onPress={() => changeSensor(-1)} 
              disabled={currentSensor <= 1}
              color="#D4AF37"
            />
            <Animated.Text style={[styles.sensorText, { opacity: fadeAnim }]}>S#{currentSensor}</Animated.Text>
            <Button 
              title="►" 
              onPress={() => changeSensor(1)} 
              disabled={currentSensor >= 8}
              color="#D4AF37"
            />
          </View>
          
          <Animated.View style={[styles.card, { transform: [{ translateX: slideLeftAnim }] }]}>
            <Text style={styles.cardTitle}>{sensorData.location}</Text>
            
            <View style={styles.metricsContainer}>
              <Animated.View style={[styles.metricCard, { transform: [{ translateX: slideLeftAnim }] }]}>
                <Text style={styles.metricValue}>{sensorData.temperature}°C</Text>
                <Text style={styles.metricLabel}>Temperatura</Text>
                <Text style={styles.metricRange}>18-26°C</Text>
              </Animated.View>
              
              <Animated.View style={[styles.metricCard, { transform: [{ translateX: slideRightAnim }] }]}>
                <Text style={styles.metricValue}>{sensorData.humidity}%</Text>
                <Text style={styles.metricLabel}>Humedad</Text>
                <Text style={styles.metricRange}>40-60%</Text>
              </Animated.View>
            </View>
            
            <Animated.View style={[styles.additionalInfo, { opacity: fadeAnim }]}>
              <Text style={styles.infoText}>CO₂: {sensorData.co2} ppm</Text>
              <Text style={styles.infoText}>Batería: {sensorData.battery}%</Text>
              <Text style={[styles.infoText, { color: sensorData.status === "OK" ? "#10B981" : "#EF4444" }]}>
                Estado: {sensorData.status}
              </Text>
            </Animated.View>
          </Animated.View>
          
          <View style={styles.buttonGroup}>
            <Animated.View style={[styles.arButton, { transform: [{ scale: bounceAnim }] }]}>
              <TouchableOpacity onPress={() => setShowAR(true)}>
                <Text style={styles.arButtonText}>MODO AR</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[styles.refreshButton, { transform: [{ scale: bounceAnim }] }]}>
              <TouchableOpacity onPress={() => fetchData(currentSensor)}>
                <Text style={styles.refreshButtonText}>ACTUALIZAR</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <Animated.Text style={[styles.updateText, { opacity: fadeAnim }]}>Actualizado: {lastUpdate}</Animated.Text>
        </ScrollView>
      )}
      
      {showAR && (
        <View style={styles.arContainer}>
          <View style={styles.arBackground}>
            <Image 
              source={{ uri: 'https://i.imgur.com/JZw7g0E.png' }} 
              style={styles.arCameraView}
            />
            <Text style={styles.arEnvironment}>AR Activo</Text>
          </View>
          
          <ARPanel data={sensorData} onClose={() => setShowAR(false)} loading={loading} />
        </View>
      )}
    </View>
  );
}

// Estilos actualizados con dorados y morados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Negro profundo
  },
  header: {
    backgroundColor: '#1C0A2E', // Morado muy oscuro
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#C4B5FD', // Morado suave
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#D4AF37', // Dorado brillante
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#F0E68C', // Dorado claro
    textAlign: 'center',
  },
  fullLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    marginTop: 15,
    color: '#F0E68C',
    fontSize: 16,
  },
  sensorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2D1B4E', // Morado medio
    padding: 10,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A78BFA', // Morado claro
  },
  sensorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37', // Dorado brillante
  },
  card: {
    backgroundColor: '#1C0A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#EDE9FE', // Morado pastel para sombra
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F0E68C',
    textAlign: 'center',
    marginBottom: 15,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    backgroundColor: '#2D1B4E',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  metricLabel: {
    fontSize: 16,
    color: '#F0E68C',
    marginVertical: 5,
  },
  metricRange: {
    fontSize: 12,
    color: '#C4B5FD',
  },
  additionalInfo: {
    backgroundColor: '#2D1B4E',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  infoText: {
    fontSize: 16,
    color: '#F0E68C',
    marginVertical: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  arButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  arButtonText: {
    color: '#1C0A2E',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2D1B4E',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  refreshButtonText: {
    color: '#F0E68C',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  updateText: {
    textAlign: 'center',
    color: '#C4B5FD',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#EF4444',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  arContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0A0A',
  },
  arBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arEnvironment: {
    position: 'absolute',
    bottom: 20,
    color: '#F0E68C',
    fontSize: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.7)',
    padding: 8,
    borderRadius: 15,
  },
  arCameraView: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  arPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1C0A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#EDE9FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeText: {
    fontSize: 28,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sensorIcon: {
    backgroundColor: '#D4AF37',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#C4B5FD',
  },
  sensorIconText: {
    fontSize: 24,
  },
  panelTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F0E68C',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataCell: {
    width: '48%',
    backgroundColor: '#2D1B4E',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  dataLabel: {
    fontSize: 14,
    color: '#C4B5FD',
  },
  dataValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});