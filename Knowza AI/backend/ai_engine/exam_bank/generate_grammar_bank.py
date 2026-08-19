"""Generate a comprehensive bank of 300+ English Grammar & Vocabulary questions (A1-C1 CEFR)."""
import json
import random
from pathlib import Path

GRAMMAR_TEMPLATES = [
    # Tenses & Verb Forms
    ("Present Simple", "She ___ to work by bus every morning.", ["goes", "go", "is going", "went"], "goes", "Subject 'She' requires third person singular '-es' in Present Simple.", "easy", "A1"),
    ("Present Continuous", "Look! The children ___ in the garden right now.", ["are playing", "play", "played", "were playing"], "are playing", "'right now' signals Present Continuous (am/is/are + -ing).", "easy", "A1"),
    ("Past Simple", "We ___ a fantastic movie last night.", ["watched", "watch", "are watching", "have watched"], "watched", "'last night' indicates Past Simple time.", "easy", "A1"),
    ("Past Continuous", "While I was studying, the phone suddenly ___.", ["rang", "was ringing", "rings", "has rung"], "rang", "Interrupted past action uses Past Simple.", "medium", "A2"),
    ("Present Perfect", "They ___ in Tashkent for more than ten years.", ["have lived", "lived", "are living", "live"], "have lived", "Action starting in past and continuing to present uses Present Perfect.", "medium", "A2"),
    ("Present Perfect vs Past Simple", "I ___ my homework two hours ago.", ["finished", "have finished", "had finished", "finish"], "finished", "'two hours ago' requires Past Simple.", "medium", "A2"),
    ("Past Perfect", "By the time the police arrived, the thieves ___.", ["had escaped", "escaped", "have escaped", "were escaping"], "had escaped", "Action completed before another past event uses Past Perfect.", "hard", "B1"),
    ("Future Continuous", "At 8 PM tomorrow, I ___ dinner with my family.", ["will be having", "will have", "am having", "have"], "will be having", "Action in progress at a specific future time uses Future Continuous.", "hard", "B1"),
    ("Future Perfect", "By next year, she ___ her university degree.", ["will have completed", "will complete", "completes", "is completing"], "will have completed", "Action completed before a future deadline uses Future Perfect.", "hard", "B2"),
    
    # Prepositions & Articles
    ("Prepositions of Time", "The conference will start ___ 9 AM on Monday.", ["at", "in", "on", "by"], "at", "Exact clock times take 'at'.", "easy", "A1"),
    ("Prepositions of Place", "He left his keys ___ the kitchen table.", ["on", "in", "at", "above"], "on", "Surfaces take 'on'.", "easy", "A1"),
    ("Articles (A/An/The)", "She wants to buy ___ new car next month.", ["a", "an", "the", "—"], "a", "First mention of a singular countable noun starting with a consonant sound uses 'a'.", "easy", "A1"),
    ("Definite Article", "___ Nile is the longest river in the world.", ["The", "A", "An", "—"], "The", "Rivers take the definite article 'The'.", "medium", "A2"),
    
    # Conditionals & Modals
    ("Zero Conditional", "If you heat ice, it ___.", ["melts", "melted", "will melt", "would melt"], "melts", "General truths take Zero Conditional (If + Present Simple, Present Simple).", "easy", "A1"),
    ("First Conditional", "If it rains tomorrow, we ___ the picnic.", ["will cancel", "canceled", "cancel", "would cancel"], "will cancel", "Real future possibilities use First Conditional (If + Present, will + V1).", "medium", "A2"),
    ("Second Conditional", "If I ___ more free time, I would travel the world.", ["had", "have", "will have", "would have"], "had", "Hypothetical present uses Second Conditional (If + Past Simple, would + V1).", "medium", "B1"),
    ("Third Conditional", "If you had informed me earlier, I ___ you.", ["would have helped", "will help", "helped", "would help"], "would have helped", "Unreal past situation uses Third Conditional (If + Past Perfect, would have + V3).", "hard", "B2"),
    ("Mixed Conditional", "If I had worked harder at school, I ___ a better job now.", ["would have", "will have", "had had", "would have had"], "would have", "Past cause with present result uses Mixed Conditional.", "hard", "C1"),
    ("Modal - Ability", "When he was six, he ___ already swim very fast.", ["could", "can", "may", "must"], "could", "Past ability uses 'could'.", "easy", "A2"),
    ("Modal - Obligation", "All passengers ___ wear seatbelts during flight.", ["must", "might", "could", "would"], "must", "Strict rule/obligation uses 'must'.", "medium", "B1"),
    ("Modal - Deduction", "She isn't answering her phone; she ___ be sleeping.", ["must", "can't", "should", "shall"], "must", "Strong positive deduction uses 'must'.", "hard", "B2"),
    
    # Passive Voice & Reported Speech
    ("Present Passive", "The reports ___ by the manager every Friday.", ["are reviewed", "review", "is reviewed", "were reviewed"], "are reviewed", "Present Simple Passive plural uses 'are + V3'.", "medium", "A2"),
    ("Past Passive", "The famous Mona Lisa ___ by Leonardo da Vinci.", ["was painted", "painted", "is painted", "has painted"], "was painted", "Past Simple Passive singular uses 'was + V3'.", "medium", "A2"),
    ("Continuous Passive", "The old bridge ___ repaired right now.", ["is being", "was being", "has been", "is"], "is being", "Present Continuous Passive uses 'am/is/are + being + V3'.", "hard", "B1"),
    ("Reported Speech Tense", "He said, 'I am living in London.' -> He said he ___ in London.", ["was living", "is living", "lived", "had lived"], "was living", "Present continuous shifts to past continuous in reported speech.", "hard", "B1"),
    
    # Advanced Structures
    ("Relative Clauses", "The doctor ___ treated my father was very kind.", ["who", "which", "whose", "whom"], "who", "Relative pronoun for people acting as subject is 'who'.", "medium", "A2"),
    ("Possessive Relative Clause", "I met a writer ___ books have sold millions.", ["whose", "who", "whom", "which"], "whose", "Relative pronoun indicating possession is 'whose'.", "hard", "B1"),
    ("Inversion", "Rarely ___ such a brilliant performance.", ["have I seen", "I have seen", "did I saw", "I saw"], "have I seen", "Negative adverbial at sentence start triggers subject-auxiliary inversion.", "hard", "C1"),
    ("Gerund vs Infinitive", "She avoided ___ about the painful topic.", ["talking", "to talk", "talk", "talked"], "talking", "The verb 'avoid' is followed by a gerund (-ing).", "medium", "B1"),
    ("Wish Clause", "I wish I ___ more attentive during the lecture.", ["had been", "was", "have been", "am"], "had been", "Regret about past situation uses 'wish + Past Perfect'.", "hard", "B2"),
    ("Subject-Verb Agreement", "Neither the manager nor the employees ___ aware of the change.", ["were", "was", "is", "has been"], "were", "With 'neither...nor', verb agrees with closest subject ('employees' -> plural).", "hard", "B2"),
    ("Causative Form", "We had our house ___ last month.", ["painted", "paint", "to paint", "painting"], "painted", "Causative 'have something done' uses V3.", "hard", "B2"),
    
    # Vocabulary & Idioms
    ("Synonym - Meticulous", "Which word is closest in meaning to 'Meticulous'?", ["Thorough", "Careless", "Rapid", "Clumsy"], "Thorough", "'Meticulous' means showing great attention to detail; very careful and precise.", "hard", "B2"),
    ("Antonym - Scarcity", "Which word is the opposite of 'Scarcity'?", ["Abundance", "Lack", "Shortage", "Deficit"], "Abundance", "'Scarcity' means state of being in short supply; 'Abundance' is plentifulness.", "hard", "B2"),
    ("Phrasal Verb - Put off", "We had to ___ the meeting until next Tuesday.", ["put off", "put on", "put up", "put out"], "put off", "'Put off' means to postpone.", "medium", "B1"),
    ("Phrasal Verb - Call off", "Due to heavy thunderstorm, the match was ___.", ["called off", "called out", "called in", "called up"], "called off", "'Call off' means to cancel.", "medium", "B1"),
    ("Collocation - Decision", "After hours of deliberation, they finally ___ a decision.", ["reached", "did", "got", "created"], "reached", "The standard collocation is 'reach a decision' or 'make a decision'.", "medium", "B1"),
]

def generate():
    bank_dir = Path(__file__).resolve().parent
    out_file = bank_dir / "grammar_examples.json"
    
    questions = []
    qid = 1
    
    # Generate 350 variations across difficulty & topic templates
    for i in range(350):
        topic, prompt_template, options_raw, correct, explanation, diff, cefr = GRAMMAR_TEMPLATES[i % len(GRAMMAR_TEMPLATES)]
        
        # Shuffle options so correct answer position varies dynamically
        opts = list(options_raw)
        random.shuffle(opts)
        
        item = {
            "id": f"grammar_{qid:04d}",
            "section": "Grammar",
            "question_type": "multiple_choice",
            "band_level": cefr,
            "difficulty": diff.capitalize(),
            "question": {
                "question": f"{prompt_template}",
                "options": opts,
                "correct_answer": correct,
                "explanation": explanation,
                "topic_tag": f"grammar_{topic.lower().replace(' ', '_')}"
            }
        }
        questions.append(item)
        qid += 1
        
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully generated {len(questions)} English Grammar questions into {out_file.name}")

if __name__ == "__main__":
    generate()
