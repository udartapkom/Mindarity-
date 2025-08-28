import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Paragraph,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import Toast from 'react-native-toast-message';

type TwoFactorScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'TwoFactor'>;
type TwoFactorScreenRouteProp = RouteProp<AuthStackParamList, 'TwoFactor'>;

const TwoFactorScreen: React.FC = () => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 минут
  const [canResend, setCanResend] = useState(false);

  const navigation = useNavigation<TwoFactorScreenNavigationProp>();
  const route = useRoute<TwoFactorScreenRouteProp>();
  const { loginWith2FA } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const { userId, message } = route.params;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!otpCode.trim() || otpCode.length < 4) {
      Alert.alert('Ошибка', 'Введите корректный код');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginWith2FA(userId, otpCode.trim());
      
      if (response.user && response.access_token) {
        Toast.show({
          type: 'success',
          text1: 'Успешный вход',
          text2: `Добро пожаловать, ${response.user.username}!`,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Неверный код. Попробуйте снова.';
      Alert.alert('Ошибка', errorMessage);
      setOtpCode('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    // Здесь можно добавить логику для повторной отправки кода
    Alert.alert('Информация', 'Код отправлен повторно');
    setTimeLeft(300);
    setCanResend(false);
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Двухфакторная аутентификация</Title>
            <Paragraph style={styles.subtitle}>
              {message}
            </Paragraph>

            <TextInput
              ref={inputRef}
              label="Код подтверждения"
              value={otpCode}
              onChangeText={setOtpCode}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              disabled={isLoading}
            />

            <Text style={styles.timerText}>
              Время действия кода: {formatTime(timeLeft)}
            </Text>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading || otpCode.length < 4}
            >
              Подтвердить
            </Button>

            {canResend && (
              <Button
                mode="text"
                onPress={handleResendCode}
                style={styles.linkButton}
                disabled={isLoading}
              >
                Отправить код повторно
              </Button>
            )}

            <Button
              mode="text"
              onPress={handleBackToLogin}
              style={styles.linkButton}
              disabled={isLoading}
            >
              Вернуться к входу
            </Button>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1976d2',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  timerText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
});

export default TwoFactorScreen;
