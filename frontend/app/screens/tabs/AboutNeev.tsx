import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../constants/Theme';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import AppEmoji from '../../../components/AppEmoji';

export default function AboutNeev() {
  const navigation = useNavigation<any>();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(24)} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>About NEEV</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/images/neuron_avatar.jpeg')}
            style={styles.logo}
          />
          <Text style={styles.appName}>NEEV</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            Neev (meaning "Foundation") is designed to be the bedrock of your parenting journey.
            We combine developmental science with modern AI to provide parents with personalized,
            actionable guidance for every stage of their child's growth.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Connect With Us</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://neevios.com')}>
              <Ionicons name="globe-outline" size={scale(20)} color={Theme.colors.primary} />
              <Text style={styles.linkText}>Website</Text>
              <Ionicons name="open-outline" size={scale(16)} color={Theme.colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem} onPress={() => openLink('https://instagram.com/neev')}>
              <Ionicons name="logo-instagram" size={scale(20)} color={Theme.colors.primary} />
              <Text style={styles.linkText}>Instagram</Text>
              <Ionicons name="open-outline" size={scale(16)} color={Theme.colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.linkItem, { borderBottomWidth: 0 }]} onPress={() => openLink('mailto:hello@neevios.com')}>
              <Ionicons name="mail-outline" size={scale(20)} color={Theme.colors.primary} />
              <Text style={styles.linkText}>Contact Support</Text>
              <Ionicons name="open-outline" size={scale(16)} color={Theme.colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Made with </Text>
            <AppEmoji style={styles.footerText}>❤️</AppEmoji>
            <Text style={styles.footerText}> for parents everywhere.</Text>
          </View>
          <Text style={styles.copyright}>© 2024 Neev Wellness Private Limited</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(30),
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  logo: {
    width: scale(100),
    height: scale(100),
    borderRadius: moderateScale(30),
    marginBottom: verticalScale(15),
  },
  appName: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: 2,
  },
  versionText: {
    fontSize: moderateScale(14),
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: moderateScale(25),
    padding: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Theme.shadows.soft,
    marginBottom: verticalScale(20),
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: verticalScale(10),
  },
  cardText: {
    fontSize: moderateScale(15),
    color: Theme.colors.primary,
    lineHeight: moderateScale(24),
    opacity: 0.8,
  },
  section: {
    marginBottom: verticalScale(25),
  },
  sectionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: Theme.colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: verticalScale(12),
    marginLeft: scale(10),
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    borderStyle: 'dashed',
  },
  linkText: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: Theme.colors.primary,
    marginLeft: scale(15),
  },
  footer: {
    marginTop: verticalScale(20),
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Theme.colors.primary,
    opacity: 0.8,
  },
  copyright: {
    fontSize: moderateScale(12),
    color: Theme.colors.textLight,
    marginTop: verticalScale(5),
  },
});
