import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../../constants/Theme';
import { useAIStore } from '../../../store/useAIStore';
import { useAuth } from '../../contexts/AuthContext';
import Animated, {
  FadeInUp,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scale, verticalScale, moderateScale } from '../../../utils/responsive';
import {
  fetchActivities,
  fetchRecentHistory,
  saveActivityToHistory,
  deleteActivityFromHistory,
  getAgeGroup
} from '../../../services/DirectusApiClient';
import { Activity, ActivityHistory } from '../../../types/activities';
import AppEmoji from '../../../components/AppEmoji';

const DOMAIN_DATA = [
  { name: 'Gross Motor', emoji: '🧗', description: 'Focuses on large muscle groups, balance, and coordination.' },
  { name: 'Fine Motor', emoji: '🎨', description: 'Develops small muscle movements in hands and fingers.' },
  { name: 'Speech & Language', emoji: '📚', description: 'Encourages communication skills and vocabulary growth.' },
  { name: 'Visual Processing', emoji: '👁️', description: 'Helps interpret and organize visual information.' },
  { name: 'Oral Motor', emoji: '👅', description: 'Develops mouth and tongue muscles for eating and speech.' },
  { name: 'Proprioception', emoji: '🧘', description: 'Understanding body position and planning movements.' },
  { name: 'Spatial Awareness', emoji: '🧗‍♂️', description: 'Understanding distance and space during movement.' },
  { name: 'Cause and Effect', emoji: '🔄', description: 'Teaches that actions can make things happen.' },
  { name: 'Vestibular', emoji: '🎢', description: 'Stimulates balance and spatial orientation.' },
  { name: 'Early Literacy', emoji: '📖', description: 'Foundation for reading and writing through books.' },
  { name: 'Cognitive', emoji: '💡', description: 'Stimulates brain development and memory.' },
  { name: 'Social & Emotional', emoji: '🧸', description: 'Helps understand emotions and build confidence.' },
  { name: 'Sensory', emoji: '🌈', description: 'Explores the five senses and reactions.' },
  { name: 'Midline Crossing', emoji: '↔️', description: 'Reaching across the middle of the body.' },
  { name: 'Visual Tracking', emoji: '🎯', description: 'Following moving objects with the eyes.' },
  { name: 'Bilateral Coordination', emoji: '👐', description: 'Using both sides of the body together.' },
  { name: 'Problem Solving', emoji: '🧐', description: 'Developing the ability to find solutions.' },
  { name: 'Core Strength', emoji: '🎯', description: 'Strengthening trunk muscles for stability.' },
  { name: 'Auditory Processing', emoji: '👂', description: 'Interpreting sound information.' },
  { name: 'Self-Regulation', emoji: '🎭', description: 'Developing emotional management and calm.' }
];

const FocusQuestionnaire = ({ allActivities, onComplete, onClose, dialItems }: { allActivities: Activity[], onComplete: (activity: Activity) => void, onClose: () => void, dialItems: any[] }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [domainOptions, setDomainOptions] = useState<{name: string, emoji: string}[]>([]);
  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [selectedDomainName, setSelectedDomainName] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { user } = useAuth();

  const questions = [
    {
      id: 'focus',
      text: "What's the main focus for today?",
      options: [
        { label: 'Physical Growth', domains: ['Gross Motor', 'Fine Motor', 'Proprioception', 'Core Strength'], emoji: '🧗' },
        { label: 'Communication', domains: ['Speech & Language', 'Auditory Processing', 'Early Literacy', 'Oral Motor'], emoji: '📚' },
        { label: 'Brain Power', domains: ['Cognitive', 'Problem Solving', 'Cause and Effect', 'Visual Tracking'], emoji: '💡' },
        { label: 'Emotional Calm', domains: ['Self-Regulation', 'Social & Emotional', 'Sensory'], emoji: '🎭' }
      ]
    },
    {
      id: 'mood',
      text: "How's the energy level?",
      options: [
        { label: 'High Energy', energy: 'High', emoji: '⚡' },
        { label: 'Quiet focus', energy: 'Focused', emoji: '🧘' },
        { label: 'Relaxed', energy: 'Relaxed', emoji: '🌙' }
      ]
    },
    {
      id: 'environment',
      text: "Where are you playing?",
      options: [
        { label: 'At Home', type: 'Indoor', emoji: '🏠' },
        { label: 'Outside', type: 'Outdoor', emoji: '🌳' },
        { label: 'On the Go', type: 'Travel', emoji: '🚗' }
      ]
    },
    {
      id: 'time',
      text: "How much time do you have?",
      options: [
        { label: 'Quick Play', duration: '< 10', emoji: '⏱️' },
        { label: 'Set Session', duration: '15-30', emoji: '⏳' },
        { label: 'Deep Dive', duration: '30+', emoji: '✨' }
      ]
    }
  ];

  const [answers, setAnswers] = useState<any>({});

  const handleOptionSelect = (opt: any) => {
    const newAnswers = { ...answers, [questions[step].id]: opt };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      processSelection(newAnswers);
    }
  };

  const processSelection = async (finalAnswers: any) => {
    setLoading(true);
    setTimeout(() => {
      const focusDomains = finalAnswers.focus.domains;
      const filtered = allActivities.filter(a => focusDomains.includes(a.domain));
      const uniqueDomains = [...new Set(filtered.map(a => a.domain))].map(name => ({
        name,
        emoji: DOMAIN_DATA.find(d => d.name === name)?.emoji || '✨'
      }));
      setDomainOptions(uniqueDomains);
      setLoading(false);
      setShowHub(true);
    }, 1500);
  };

  const handleDomainClick = (domainName: string) => {
    setSelectedDomainName(domainName);
    const domainActivities = allActivities.filter(a => a.domain === domainName).slice(0, 6);
    setActivityOptions(domainActivities);
    setSelectedActivity(null);
  };

  if (showHub) {
    const activeEmoji = selectedDomainName
      ? DOMAIN_DATA.find(d => d.name === selectedDomainName)?.emoji
      : null;

    const displayItems = selectedDomainName ? activityOptions : domainOptions;
    const activeChild = user?.children?.[0];
    const domainInfo = selectedActivity ? DOMAIN_DATA.find(d => d.name === selectedActivity.domain) : null;

    return (
      <View style={styles.hubModalContainer}>
        <View style={styles.hubModalHeader}>
          <Text style={styles.hubModalTitle}>{selectedDomainName ? selectedDomainName : 'Neev Play Intelligence'}</Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.circleHubWrapper}>
          <View style={styles.hubMidline} />
          <TouchableOpacity
            style={styles.hubCenterWand}
            onPress={() => setSelectedDomainName(null)}
            activeOpacity={0.8}
          >
            <View style={styles.innerWandCircle}>
              {activeEmoji ? (
                <AppEmoji style={{fontSize: scale(45)}}>{activeEmoji}</AppEmoji>
              ) : (
                <Ionicons name="sparkles" size={scale(55)} color="#2D5F3F" />
              )}
            </View>
          </TouchableOpacity>

          {displayItems.map((item: any, index) => {
            // Constrain items to upper arc (-160 to -20 degrees) to stay "above the line"
            const totalSweep = displayItems.length <= 3 ? 120 : 180;
            const startAngle = -90 - (totalSweep / 2);
            const angleStep = displayItems.length > 1 ? totalSweep / (displayItems.length - 1) : 0;
            const angle = displayItems.length === 1 ? -90 : startAngle + (index * angleStep);

            const radius = scale(100);
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;

            const isActivity = !!selectedDomainName;
            const isActive = isActivity
              ? selectedActivity?.id === item.id
              : selectedDomainName === item.name;

            const icon = isActivity
              ? (DOMAIN_DATA.find(d => d.name === item.domain)?.emoji || '✨')
              : item.emoji;

            const label = isActivity ? item.activity : item.name;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.hubBubble,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      { scale: isActive ? 1.1 : 0.95 }
                    ],
                    zIndex: isActive ? 20 : 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                ]}
                onPress={() => isActivity ? setSelectedActivity(item) : handleDomainClick(item.name)}
              >
                <View style={[styles.bubbleCircle, isActive && styles.bubbleCircleActive]}>
                  <AppEmoji style={{fontSize: scale(22)}}>{icon}</AppEmoji>
                </View>
                <Text style={[styles.bubbleLabel, isActive && styles.bubbleLabelActive]} numberOfLines={2}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.hubAiDetailsArea}>
          {selectedActivity ? (
            <Animated.View entering={FadeInUp} key={selectedActivity.id} style={styles.premiumAiBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.premiumAiHeader}>
                  <Ionicons name="sparkles" size={14} color={Theme.colors.primary} />
                  <Text style={styles.premiumAiTitle}>{selectedActivity.activity.toUpperCase()}</Text>
                </View>

                <Text style={styles.premiumAiDesc}>
                  {domainInfo?.description || "Develops essential developmental skills."}
                </Text>

                <Text style={[styles.premiumAiDesc, { marginTop: 10 }]}>
                  This specific activity encourages active exploration and purposeful play, helping {activeChild?.name || 'baby'} reach key developmental milestones through consistent engagement.
                </Text>

                <View style={styles.modalBenefitSection}>
                  <Text style={styles.modalBenefitTitle}>DEVELOPMENTAL IMPACT</Text>
                  <Text style={styles.modalBenefitText}>
                    Strengthens {selectedActivity.domain.toLowerCase()} skills in {activeChild?.name || 'baby'}. Consistent practice promotes neural plasticity and complex capabilities.
                  </Text>
                </View>
              </ScrollView>
            </Animated.View>
          ) : (
            <Text style={styles.hubInstruction}>
              {selectedDomainName ? 'Pick an activity to start' : 'Select an area to explore AI activity suggestions'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.premiumDoneBtn, !selectedActivity && styles.doneBtnDisabled]}
          disabled={!selectedActivity}
          onPress={() => onComplete(selectedActivity!)}
        >
          <Text style={styles.premiumDoneBtnText}>Select Activity</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.qContainer}>
      <View style={styles.qHeader}>
        <Text style={styles.qBadge}>PREMIUM CURATION</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Theme.colors.primary} /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.qLoadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.qLoadingText}>NEEV AI is crafting your play intelligence...</Text>
        </View>
      ) : (
        <Animated.View entering={FadeInRight} key={step} style={{flex: 1}}>
          <Text style={styles.qTitleSmall}>{questions[step].text}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.qOptionsList}>
            {questions[step].options.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.qOptionLargeBtn} onPress={() => handleOptionSelect(opt)}>
                <View style={styles.qOptionIconBox}>
                  <AppEmoji style={styles.qOptionEmoji}>{opt.emoji}</AppEmoji>
                </View>
                <Text style={styles.qOptionLargeLabel}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

export default function DiscoveryHub() {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { guidanceData } = useAIStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [history, setHistory] = useState<ActivityHistory[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDial, setShowDial] = useState(false);
  const [viewMode, setViewMode] = useState<'insights' | 'steps'>('insights');
  const [pendingAction, setPendingAction] = useState<{ type: 'complete', activity: Activity | null }>({ type: 'complete', activity: null });

  const activeChild = user?.children?.[0];
  const ageGroup = useMemo(() => activeChild?.dob ? getAgeGroup(activeChild.dob) : 'Infant', [activeChild]);
  const dialItems = useMemo(() => [{ name: null, emoji: '🌟' }, ...DOMAIN_DATA], []);

  const pickRandomActivity = useCallback((activities: Activity[], recentHistory: ActivityHistory[], domainFilter: string | null = null) => {
    const dailyPlanIds = guidanceData?.daily_tasks?.map(t => String(t.title)) || [];
    const historyIds = recentHistory.map(h => String(h.activity_id));
    let available = activities.filter(a => !dailyPlanIds.includes(a.activity) && !historyIds.includes(String(a.id)));
    if (domainFilter) available = available.filter(a => a.domain === domainFilter);
    const source = available.length > 0 ? available : (domainFilter ? activities.filter(a => a.domain === domainFilter) : activities);
    setCurrentActivity(source[Math.floor(Math.random() * source.length)] || null);
  }, [guidanceData]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [activities, recentHistory] = await Promise.all([fetchActivities(ageGroup), fetchRecentHistory(user.id.toString())]);
      setAllActivities(activities);
      setHistory(recentHistory.filter(h => h.category === 'Discovery Hub'));
      if (!currentActivity || isRefresh) pickRandomActivity(activities, recentHistory, selectedDomain);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, [user?.id, ageGroup, currentActivity, selectedDomain, pickRandomActivity]);

  useEffect(() => { if (token) loadData(); }, [token]);

  const handleDomainSelect = (domain: string | null) => {
    setSelectedDomain(domain);
    pickRandomActivity(allActivities, history, domain);
    setShowDial(false);
  };

  const confirmAction = async () => {
    if (!pendingAction.activity || !user?.id) return;
    try {
      await saveActivityToHistory(user.id.toString(), String(pendingAction.activity.id), 'Discovery Hub');
      const recentHistory = await fetchRecentHistory(user.id.toString());
      setHistory(recentHistory.filter(h => h.category === 'Discovery Hub'));
      pickRandomActivity(allActivities, recentHistory, selectedDomain);
    } catch (e) { Alert.alert("Error", "Update failed"); } finally { setShowConfirmModal(false); }
  };

  const handleUndoHistory = async (item: ActivityHistory) => {
    Alert.alert("Undo", "Mark as pending?", [
      { text: "No" },
      { text: "Yes", onPress: async () => {
        await deleteActivityFromHistory(item.id, user.id.toString());
        const history = await fetchRecentHistory(user.id.toString());
        setHistory(history.filter(h => h.category === 'Discovery Hub'));
      }}
    ]);
  };

  const renderActivityCard = () => {
    if (!currentActivity) return null;
    const domainInfo = DOMAIN_DATA.find(d => d.name === currentActivity.domain);
    return (
      <Animated.View entering={FadeInRight} exiting={FadeOutLeft} key={currentActivity.id} style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}><AppEmoji style={{fontSize: 28}}>{domainInfo?.emoji || '✨'}</AppEmoji></View>
          <View style={styles.titleArea}>
            <Text style={styles.domainTagPremiumText}>{currentActivity.domain.toUpperCase()}</Text>
            <Text style={styles.activityNamePremium}>{currentActivity.activity}</Text>
          </View>
          <TouchableOpacity
            style={styles.premiumCheckBtn}
            onPress={() => { setPendingAction({ type: 'complete', activity: currentActivity }); setShowConfirmModal(true); }}
          >
             <Ionicons name="checkmark-done-sharp" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'insights' && styles.toggleBtnActive]}
            onPress={() => setViewMode('insights')}
          >
            <Ionicons name="sparkles-outline" size={16} color={viewMode === 'insights' ? 'white' : Theme.colors.primary} />
            <Text style={[styles.toggleText, viewMode === 'insights' && styles.toggleTextActive]}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'steps' && styles.toggleBtnActive]}
            onPress={() => setViewMode('steps')}
          >
            <Ionicons name="book-outline" size={16} color={viewMode === 'steps' ? 'white' : Theme.colors.primary} />
            <Text style={[styles.toggleText, viewMode === 'steps' && styles.toggleTextActive]}>Playbook</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'insights' ? (
          <View style={styles.aiIntelligenceLarge}>
            <View style={styles.aiHeaderLarge}>
              <View style={styles.aiIconBadge}>
                <Ionicons name="sparkles" size={14} color="white" />
              </View>
              <Text style={styles.aiTitleLarge}>NEEV INTELLIGENCE</Text>
            </View>

            <View style={styles.aiInfoSection}>
              <Text style={styles.aiDescLarge}>
                {domainInfo?.description || "A tailored focus area for your child's growth."}
                {"\n\n"}This specific activity encourages active exploration and purposeful play, helping {activeChild?.name || 'baby'} reach key developmental milestones through consistent engagement.
              </Text>
            </View>

            <View style={styles.aiBenefitSection}>
              <Text style={styles.aiBenefitTitle}>DEVELOPMENTAL IMPACT</Text>
              <Text style={styles.aiBenefitTextLarge}>
                This activity directly strengthens milestones in {activeChild?.name || 'baby'}.
                {"\n\n"}Consistent practice promotes neural plasticity and the development of complex capabilities essential for future learning.
              </Text>
            </View>

            <View style={styles.badgeRowPremium}>
              <View style={styles.premiumBadge}><Ionicons name="flash" size={12} color="#00796B" /><Text style={styles.premiumBadgeText}>{currentActivity.energy_level}</Text></View>
              <View style={styles.premiumBadge}><Ionicons name="time" size={12} color={Theme.colors.textLight} /><Text style={styles.premiumBadgeText}>{currentActivity.duration_mins} mins</Text></View>
            </View>
          </View>
        ) : (
          <View style={styles.stepsLargeContent}>
            <View style={styles.stepsHeaderInside}>
              <View style={[styles.aiIconBadge, { backgroundColor: Theme.colors.primary }]}>
                <Ionicons name="list" size={14} color="white" />
              </View>
              <Text style={styles.stepsTitleInside}>GUIDED STEPS</Text>
            </View>

            <View style={styles.stepsDescriptionBox}>
              <Text style={styles.stepsDescriptionText}>{currentActivity.description}</Text>
            </View>

            {currentActivity.tools && (
               <View style={styles.toolsBoxInside}>
                  <Text style={styles.toolsLabelInside}>EQUIPMENT NEEDED</Text>
                  <Text style={styles.toolsTextInside}>{currentActivity.tools}</Text>
               </View>
            )}

            <View style={styles.badgeRowPremium}>
              <View style={styles.premiumBadge}><Ionicons name="flash" size={12} color="#00796B" /><Text style={styles.premiumBadgeText}>{currentActivity.energy_level}</Text></View>
              <View style={styles.premiumBadge}><Ionicons name="time" size={12} color={Theme.colors.textLight} /><Text style={styles.premiumBadgeText}>{currentActivity.duration_mins} mins</Text></View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.premiumRefreshBtn} onPress={() => pickRandomActivity(allActivities, history, selectedDomain)}>
          <Ionicons name="refresh" size={18} color="white" /><Text style={styles.premiumRefreshBtnText}>Explore Alternative</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color={Theme.colors.primary} /></TouchableOpacity>
        <View style={styles.headerTitleContainer}><Text style={styles.headerTitle}>Discovery Hub</Text><Text style={styles.headerSubtitle}>Personalised Play Intelligence</Text></View>
        <TouchableOpacity onPress={() => navigation.navigate('ActivityHistory')} style={styles.nurtureLogBtn}>
          <Ionicons name="journal" size={18} color="#2D5F3F" /><Text style={styles.nurtureLogText}>LOG</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(true); }} tintColor={Theme.colors.secondary} />}>

        <View style={styles.discoveryControl}>
          <Text style={styles.controlTitle}>Curate by Focus</Text>
          <TouchableOpacity style={styles.dialTrigger} onPress={() => setShowDial(true)}>
            <View style={styles.dialIconBox}>
               <AppEmoji style={{fontSize: 22}}>{DOMAIN_DATA.find(d => d.name === selectedDomain)?.emoji || '🌟'}</AppEmoji>
            </View>
            <View style={{flex: 1}}>
               <Text style={styles.triggerLabel}>NEEV INTELLIGENCE</Text>
               <Text style={styles.triggerText}>{selectedDomain || 'All Focus Areas'}</Text>
            </View>
            <View style={styles.dialOptionsBox}>
               <Ionicons name="options" size={20} color={Theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? <View style={styles.centerLoading}><ActivityIndicator size="large" color={Theme.colors.primary} /></View> : renderActivityCard()}

        {history.length > 0 && (
          <View style={styles.horizontalHistoryContainer}>
            <Text style={styles.horizontalHistoryTitle}>Recently Completed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalHistoryScroll}>
              {history.slice(0, 10).map((item) => {
                const detail = allActivities.find(a => String(a.id) === String(item.activity_id));
                const domain = DOMAIN_DATA.find(d => d.name === detail?.domain);
                return (
                  <TouchableOpacity key={item.id} style={styles.historyCircleItem} onPress={() => handleUndoHistory(item)}>
                    <View style={styles.historyCircle}>
                      <AppEmoji style={{fontSize: 20}}>{domain?.emoji || '✅'}</AppEmoji>
                    </View>
                    <Text style={styles.historyCircleName} numberOfLines={1}>{detail?.activity?.split(' ')[0] || "Activity"}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.historyCircleItem} onPress={() => navigation.navigate('ActivityHistory')}>
                <View style={[styles.historyCircle, { backgroundColor: Theme.colors.softSlate }]}>
                  <Ionicons name="arrow-forward" size={20} color={Theme.colors.primary} />
                </View>
                <Text style={styles.historyCircleName}>View All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>

      <Modal visible={showDial} transparent animationType="slide">
        <View style={styles.qModalOverlay}>
          <FocusQuestionnaire
            allActivities={allActivities}
            dialItems={dialItems}
            onComplete={(activity) => {
              setCurrentActivity(activity);
              setSelectedDomain(activity.domain);
              setShowDial(false);
            }}
            onClose={() => setShowDial(false)}
          />
        </View>
      </Modal>
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalIcon}><Ionicons name="ribbon-outline" size={40} color={Theme.colors.primary} /></View><Text style={styles.modalTitle}>Activity Completed?</Text><Text style={styles.modalSub}>Great job!</Text><View style={styles.modalButtons}><TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirmModal(false)}><Text style={styles.modalCancelText}>Not Yet</Text></TouchableOpacity><TouchableOpacity style={styles.modalConfirm} onPress={confirmAction}><Text style={styles.modalConfirmText}>Confirm</Text></TouchableOpacity></View></View></View>
      </Modal>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: verticalScale(15) },
  backBtn: { width: scale(40), height: scale(40), justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, ...Theme.shadows.soft },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: moderateScale(20), fontWeight: '800', color: Theme.colors.primary },
  headerSubtitle: { fontSize: moderateScale(12), color: Theme.colors.textLight, fontWeight: '600' },
  nurtureLogBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: scale(12), paddingVertical: verticalScale(8), borderRadius: 12, borderWidth: 1.5, borderColor: '#FDE68A', gap: scale(6), ...Theme.shadows.soft },
  nurtureLogText: { fontSize: moderateScale(12), fontWeight: '900', color: '#2D5F3F' },
  scrollContent: { padding: scale(10) },
  discoveryControl: { marginBottom: verticalScale(25) },
  controlTitle: { fontSize: moderateScale(16), fontWeight: '800', color: Theme.colors.primary, marginBottom: verticalScale(12), letterSpacing: 0.5 },
  dialTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: moderateScale(10),
    borderRadius: moderateScale(30),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: scale(15),
    shadowColor: '#FEF3C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  dialIconBox: {
    width: scale(54),
    height: scale(54),
    backgroundColor: '#FFFBEB',
    borderRadius: scale(27),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FEF3C7'
  },
  triggerLabel: { fontSize: moderateScale(10), fontWeight: '900', color: Theme.colors.textLight, letterSpacing: 1.8, marginBottom: 2, textTransform: 'uppercase' },
  triggerText: { fontSize: moderateScale(18), fontWeight: '800', color: Theme.colors.primary },
  dialOptionsBox: {
    width: scale(40),
    height: scale(40),
    backgroundColor: '#F8FAFC',
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 4
  },
  activityCard: { backgroundColor: Theme.colors.white, borderRadius: moderateScale(30), padding: moderateScale(18), borderWidth: 1, borderColor: '#F1F5F9', ...Theme.shadows.soft, marginBottom: verticalScale(30) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(20) },
  iconBox: { width: scale(60), height: scale(60), backgroundColor: '#F0F9FF', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: scale(12) },
  titleArea: { flex: 1 },
  activityNamePremium: { fontSize: moderateScale(20), fontWeight: '800', color: Theme.colors.primary, marginBottom: 2 },
  domainTagPremiumText: { fontSize: moderateScale(11), color: '#2D5F3F', fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  premiumCheckBtn: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft,
    borderWidth: 3,
    borderColor: 'white'
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    padding: 6,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: scale(2)
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    gap: 10
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.soft
  },
  toggleText: { fontSize: 14, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 0.5 },
  toggleTextActive: { color: 'white' },
  aiIntelligenceLarge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 30,
    padding: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...Theme.shadows.soft
  },
  aiHeaderLarge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  aiIconBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  aiTitleLarge: { fontSize: 10, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 2 },
  aiInfoSection: { marginBottom: 22 },
  aiDescLarge: { fontSize: 14, color: Theme.colors.text, lineHeight: 22, fontWeight: '500' },
  aiBenefitSection: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 22,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
    ...Theme.shadows.soft
  },
  aiBenefitTitle: { fontSize: 9, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 1.5, marginBottom: 8 },
  aiBenefitTextLarge: { fontSize: 13, color: Theme.colors.text, lineHeight: 20, fontStyle: 'italic', fontWeight: '400' },
  stepsLargeContent: {
    backgroundColor: '#FDFCFB',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    ...Theme.shadows.soft
  },
  stepsHeaderInside: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  stepsTitleInside: { fontSize: 10, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 2 },
  stepsDescriptionBox: { marginBottom: 22 },
  stepsDescriptionText: { fontSize: 15, color: Theme.colors.text, lineHeight: 24, fontWeight: '500' },
  toolsBoxInside: {
    backgroundColor: '#FEF3C7',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 22
  },
  toolsLabelInside: { fontSize: 9, fontWeight: '900', color: '#2D5F3F', marginBottom: 8, letterSpacing: 1.5 },
  toolsTextInside: { fontSize: 14, color: Theme.colors.primary, fontWeight: '700' },
  badgeRowPremium: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  premiumBadgeText: { fontSize: 11, fontWeight: '800', color: Theme.colors.text },
  horizontalHistoryContainer: {
    marginBottom: verticalScale(25),
    backgroundColor: 'white',
    padding: moderateScale(15),
    borderRadius: moderateScale(28),
    ...Theme.shadows.soft,
    borderWidth: 1.5,
    borderColor: '#F1F5F9'
  },
  horizontalHistoryTitle: { fontSize: moderateScale(13), fontWeight: '900', color: Theme.colors.primary, marginBottom: verticalScale(15), letterSpacing: 1, textTransform: 'uppercase' },
  horizontalHistoryScroll: { paddingRight: scale(20) },
  historyCircleItem: { alignItems: 'center', marginRight: scale(18), width: scale(60) },
  historyCircle: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(8)
  },
  historyCircleName: { fontSize: moderateScale(9), fontWeight: '800', color: Theme.colors.textLight, textAlign: 'center' },
  premiumRefreshBtn: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary,
    borderRadius: moderateScale(24),
    paddingVertical: verticalScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(10),
    ...Theme.shadows.soft
  },
  premiumRefreshBtnText: { color: 'white', fontSize: moderateScale(15), fontWeight: '800' },
  footerSpacer: { height: scale(50) },
  centerLoading: { height: 300, justifyContent: 'center', alignItems: 'center' },
  qModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  qContainer: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '98%', padding: 25, ...Theme.shadows.soft },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  qBadge: { fontSize: 11, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 2, backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  qTitleSmall: { fontSize: 26, fontWeight: '800', color: Theme.colors.primary, marginBottom: 35 },
  qOptionsList: { marginTop: 15 },
  qOptionLargeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 22, borderRadius: 28, marginBottom: 18, borderWidth: 1.5, borderColor: '#F1F5F9', ...Theme.shadows.soft },
  qOptionIconBox: { width: scale(64), height: scale(64), backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  qOptionEmoji: { fontSize: scale(36) },
  qOptionLargeLabel: { flex: 1, fontSize: 19, fontWeight: '700', color: Theme.colors.primary },
  qLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  qLoadingText: { marginTop: 20, fontSize: 16, color: Theme.colors.primary, fontWeight: '600', textAlign: 'center' },
  hubModalContainer: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '98%', padding: 25, ...Theme.shadows.soft },
  hubModalHeader: { alignItems: 'center', marginBottom: 15 },
  hubModalTitle: { fontSize: 22, fontWeight: '900', color: '#2D5F3F' },
  titleUnderline: { width: scale(80), height: 3, backgroundColor: '#FDE68A', marginTop: 8, borderRadius: 2 },
  circleHubWrapper: { height: scale(220), justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 0 },
  hubMidline: { position: 'absolute', width: '100%', height: 1.5, backgroundColor: '#F1F5F9', top: '65%' },
  hubCenterWand: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FEF3C7',
    ...Theme.shadows.soft,
    zIndex: 10,
    top: '15%'
  },
  innerWandCircle: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft
  },
  hubBubble: { position: 'absolute', alignItems: 'center', width: scale(85), justifyContent: 'center', top: '15%' },
  bubbleCircle: { width: scale(54), height: scale(54), borderRadius: scale(27), backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...Theme.shadows.soft },
  bubbleCircleActive: { borderColor: Theme.colors.primary, borderWidth: 3, backgroundColor: '#F0F9FF', shadowColor: Theme.colors.primary, shadowOpacity: 0.2, shadowRadius: 10 },
  bubbleLabel: { fontSize: moderateScale(9), fontWeight: '800', color: Theme.colors.textLight, marginTop: 4, textAlign: 'center', width: scale(80) },
  bubbleLabelActive: { color: Theme.colors.primary, fontWeight: '900' },
  hubAiDetailsArea: { flex: 1, justifyContent: 'center', marginTop: 10, marginBottom: 15 },
  premiumAiBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 28, borderWidth: 1.5, borderColor: '#E2E8F0', flex: 1, ...Theme.shadows.soft },
  premiumAiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  premiumAiTitle: { fontSize: 12, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 1.8 },
  premiumAiDesc: { fontSize: 14, color: Theme.colors.text, lineHeight: 20, fontWeight: '500' },
  premiumAiBenefit: { fontSize: 11, color: '#2D5F3F', fontWeight: '800', fontStyle: 'italic', marginTop: 10 },
  modalBenefitSection: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 4, borderLeftColor: Theme.colors.primary },
  modalBenefitTitle: { fontSize: 10, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 1.2, marginBottom: 6 },
  modalBenefitText: { fontSize: 13, color: Theme.colors.text, lineHeight: 18, fontStyle: 'italic' },
  hubInstruction: { fontSize: 14, color: Theme.colors.textLight, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 40 },
  premiumDoneBtn: { backgroundColor: '#2D5F3F', paddingVertical: 16, borderRadius: 20, alignItems: 'center', ...Theme.shadows.soft },
  premiumDoneBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
  doneBtnDisabled: { backgroundColor: '#CBD5E1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center', width: '85%' },
  modalIcon: { width: 80, height: 80, backgroundColor: '#FEF3C7', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.primary, marginBottom: 10 },
  modalSub: { fontSize: 14, color: Theme.colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  modalButtons: { flexDirection: 'row', gap: 15 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 15, backgroundColor: Theme.colors.primary, alignItems: 'center' },
  modalCancelText: { color: Theme.colors.textLight, fontWeight: '700' },
  modalConfirmText: { color: 'white', fontWeight: '700' },
});
