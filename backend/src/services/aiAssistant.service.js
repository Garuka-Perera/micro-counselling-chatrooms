function containsAny(text, words) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function buildAiReply({ userMessage, topic, riskLevel, secondsRemaining }) {
  const text = (userMessage || "").trim();

  if (riskLevel === "HIGH") {
    return "I am really sorry that you are going through this. You deserve immediate support from a trusted person or local emergency or crisis service right now. If you are in immediate danger, please contact local emergency services now and tell someone near you immediately.";
  }

  if (!text) {
    return "I am here with you. You can tell me what is on your mind.";
  }

  if (secondsRemaining !== null && secondsRemaining <= 120) {
    return "Our session is close to ending. Let us focus on one supportive next step you can take after this chat.";
  }

  if (containsAny(text, ["anxious", "anxiety", "panic", "overthinking"])) {
    return "That sounds overwhelming. Try one grounding step right now: breathe in for 4 seconds, hold for 4 seconds, and breathe out for 6 seconds a few times. What triggered this feeling today?";
  }

  if (containsAny(text, ["sad", "depressed", "lonely", "empty", "crying"])) {
    return "I am sorry you are feeling this way. You do not have to carry it alone. Did something specific happen today, or has this been building up over time?";
  }

  if (containsAny(text, ["stress", "stressed", "exam", "assignment", "deadline", "study"])) {
    return "That sounds like a lot of pressure. Let us reduce it to one next step only. What is the single most urgent thing you need to handle first?";
  }

  if (containsAny(text, ["relationship", "breakup", "friend", "family"])) {
    return "Relationship pain can feel very heavy. I am here to listen. Do you want to tell me what happened, or how it is affecting you most right now?";
  }

  if (topic && topic.toLowerCase().includes("anxiety")) {
    return "Since this session is about anxiety, let us slow things down together. What is the strongest feeling in your body right now?";
  }

  if (topic && topic.toLowerCase().includes("stud")) {
    return "Since this session is about studies, let us focus on the pressure you are under. What task feels most difficult right now?";
  }

  return "Thank you for sharing that. I am here to listen without judgment. Tell me a little more about what happened and how it is affecting you right now.";
}

module.exports = {
  buildAiReply,
};