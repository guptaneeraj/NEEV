import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ScaleInCenter,
  ScaleOutCenter,
} from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import AppEmoji from './AppEmoji';

interface NeevModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'default' | 'danger';
  children?: React.ReactNode;
}

const { width } = Dimensions.get('window');

const NeevModal: React.FC<NeevModalProps> = ({
  visible,
  title,
  message,
  icon,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'default',
  children,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.blurBg} />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.modalContainer}
        >
          {icon && (
            <View style={styles.iconWrapper}>
              <AppEmoji style={styles.iconText}>{icon}</AppEmoji>
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          {children}

          {(onConfirm || onCancel) && (
            <View style={styles.buttonContainer}>
              {onCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              {onConfirm && (
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    type === 'danger' && styles.dangerButton,
                    !onCancel && { width: '100%' }
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBg: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(28),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.softGreenBorder,
    ...Theme.shadows.soft,
  },
  iconWrapper: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Theme.colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  iconText: {
    fontSize: moderateScale(30),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  message: {
    fontSize: moderateScale(15),
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: moderateScale(22),
    fontWeight: '500',
    marginBottom: verticalScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: scale(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(16),
    backgroundColor: Theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(16),
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#D00000',
  },
});

export default NeevModal;
