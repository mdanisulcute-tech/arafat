import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrutalButton, BrutalCard } from "@/src/components/Brutal";
import { useTheme, SPACING, RADIUS, hardShadow } from "@/src/theme";
import { api } from "@/src/api/client";
import { QuizQuestion } from "@/src/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

type Feedback = { correct: boolean; correctIndex: number; xp: number; coins: number };

export default function QuizScreen() {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const qs = await api.get<QuizQuestion[]>("/games/quiz/questions");
        setQuestions(qs);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = questions[idx];
  const done = !loading && idx >= questions.length;

  const submit = async (answerIdx: number) => {
    if (selected !== null || busy || !q) return;
    setSelected(answerIdx);
    setBusy(true);
    try {
      const r: any = await api.post("/games/quiz/submit", {
        question_id: q.id,
        answer_index: answerIdx,
      });
      setFeedback({
        correct: r.correct,
        correctIndex: r.correct_index,
        xp: r.xp_awarded,
        coins: r.coins_awarded,
      });
      setTotalXp((x) => x + r.xp_awarded);
      setTotalCoins((c) => c + r.coins_awarded);
    } catch {
      setSelected(null);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setSelected(null);
    setFeedback(null);
    setIdx((i) => i + 1);
  };

  const finish = async () => {
    await refresh();
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.success }]}>
        <View style={styles.center}>
          <Text style={[styles.bigTitle, { color: "#0A0A0A" }]}>QUIZ COMPLETE!</Text>
          <BrutalCard background={colors.surface} style={{ marginTop: SPACING.lg, width: "100%" }}>
            <View style={styles.summaryRow}>
              <Ionicons name="flash" size={36} color={colors.text} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.sumNum, { color: colors.text }]}>+{totalXp}</Text>
                <Text style={[styles.sumLabel, { color: colors.textMuted }]}>XP EARNED</Text>
              </View>
            </View>
            <View style={[styles.summaryRow, { marginTop: SPACING.md }]}>
              <Ionicons name="cash" size={36} color={colors.warning} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.sumNum, { color: colors.text }]}>+{totalCoins}</Text>
                <Text style={[styles.sumLabel, { color: colors.textMuted }]}>COINS EARNED</Text>
              </View>
            </View>
          </BrutalCard>
          <BrutalButton
            testID="quiz-finish"
            title="DONE"
            onPress={finish}
            variant="primary"
            style={{ marginTop: SPACING.lg, alignSelf: "stretch" }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!q) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.secondary }]} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} testID="quiz-close">
          <Ionicons name="close-circle" size={32} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.progressText}>
          Question {idx + 1} / {questions.length}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <BrutalCard background={colors.surface}>
          <Text style={[styles.question, { color: colors.text }]}>{q.question}</Text>
        </BrutalCard>

        <View style={{ marginTop: SPACING.md, gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = colors.surface;
            if (feedback) {
              if (i === feedback.correctIndex) bg = colors.success;
              else if (i === selected) bg = colors.danger;
            } else if (selected === i) {
              bg = colors.warning;
            }
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                disabled={selected !== null}
                onPress={() => submit(i)}
                testID={`quiz-option-${i}`}
              >
                <BrutalCard background={bg}>
                  <Text style={[styles.opt, { color: colors.text }]}>{opt}</Text>
                </BrutalCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={{ marginTop: SPACING.lg }}>
            <BrutalCard background={feedback.correct ? colors.success : colors.danger}>
              <Text style={styles.feedbackTitle}>
                {feedback.correct ? "✓ Correct!" : "✗ Better luck next time"}
              </Text>
              <Text style={styles.feedbackSub}>
                +{feedback.xp} XP {feedback.coins ? `· +${feedback.coins} coins` : ""}
              </Text>
            </BrutalCard>
            <BrutalButton
              testID="quiz-next"
              title={idx + 1 >= questions.length ? "SEE RESULTS" : "NEXT QUESTION"}
              onPress={next}
              variant="primary"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.lg },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  progressText: { fontWeight: "900", color: "#0A0A0A", letterSpacing: 1 },
  question: { fontSize: 22, fontWeight: "900", lineHeight: 30 },
  opt: { fontSize: 16, fontWeight: "800" },
  feedbackTitle: { fontSize: 18, fontWeight: "900", color: "#0A0A0A" },
  feedbackSub: { fontSize: 14, fontWeight: "700", color: "#0A0A0A", marginTop: 4 },
  bigTitle: { fontSize: 38, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  sumNum: { fontSize: 28, fontWeight: "900" },
  sumLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 2 },
});
