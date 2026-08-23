import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, FileText, Clock, CheckCircle, Mic, MicOff, Cloud, HardDrive, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { StorageProviderFactory } from '@/services/StorageService';
import type { IStorageProvider, Story } from '@/services/StorageService';

interface InsightSlide {
  number: string | null;
  heading: string;
  bullets: string[];
}

// Insight entries arrive as a flat list where "1. Some Heading" opens a section
// and the entries after it are that section's points. Regroup them into slides.
function buildInsightSlides(insights: string[]): InsightSlide[] {
  const slides: InsightSlide[] = [];

  insights.forEach((entry) => {
    const [firstLine, ...rest] = entry.split('\n');
    const headingMatch = firstLine.match(/^(\d+)\.\s*(.+)$/);

    if (headingMatch) {
      slides.push({
        number: headingMatch[1],
        heading: headingMatch[2],
        bullets: rest.map((line) => line.trim()).filter(Boolean),
      });
      return;
    }

    if (slides.length === 0) {
      slides.push({ number: null, heading: 'Overview', bullets: [] });
    }
    slides[slides.length - 1].bullets.push(entry.trim());
  });

  return slides;
}

// "Label: explanation" bullets render with the label emphasised. The length and
// word-count limits keep a colon appearing mid-sentence from being mistaken for
// a label separator.
function splitBulletLabel(bullet: string): [string | null, string] {
  const separator = bullet.indexOf(':');
  if (separator < 3 || separator > 70) return [null, bullet];

  const candidate = bullet.slice(0, separator);
  if (candidate.split(/\s+/).length > 9) return [null, bullet];

  return [candidate, bullet.slice(separator + 1).trim()];
}

function PredictiveHistoryDeck({
  insights,
  cantica,
  chapterNumber,
  chapterTitle,
}: {
  insights: string[];
  cantica: string;
  chapterNumber: number;
  chapterTitle: string;
}) {
  const slides = React.useMemo(() => buildInsightSlides(insights), [insights]);
  const [slideIndex, setSlideIndex] = React.useState(0);

  // A new chapter means a new deck; start it from the title slide.
  React.useEffect(() => {
    setSlideIndex(0);
  }, [chapterNumber]);

  const totalSlides = slides.length + 1; // title slide, then one per section
  const goTo = React.useCallback(
    (next: number) => setSlideIndex(Math.min(totalSlides - 1, Math.max(0, next))),
    [totalSlides]
  );

  // Arrow keys drive the deck only while it holds focus, so typing elsewhere is unaffected.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(slideIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(slideIndex - 1);
    }
  };

  const activeSlide = slideIndex === 0 ? null : slides[slideIndex - 1];

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-roledescription="carousel"
      aria-label="Predictive History's Insight slides"
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-800/80 dark:bg-slate-950"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-accent/70 to-secondary/70" />

      {/* Deck chrome */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
            PH
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-foreground">Predictive History's Insight</p>
            <p className="text-xs text-foreground/50">
              {cantica} · Canto {chapterNumber}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold tabular-nums text-foreground/60 dark:bg-slate-900">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Stage */}
      <div className="relative flex min-h-[340px] flex-col justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100/70 px-8 py-10 md:min-h-[380px] md:px-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/70">
        {activeSlide === null ? (
          <div className="space-y-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
              {cantica} · Canto {chapterNumber}
            </p>
            <h5 className="text-balance text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
              {chapterTitle}
            </h5>
            <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="mx-auto mb-0 text-sm text-foreground/55">
              {slides.length} {slides.length === 1 ? 'insight' : 'insights'} from the lecture · use the arrows to advance
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl space-y-6">
            <div className="flex items-start gap-4">
              {activeSlide.number && (
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary ring-1 ring-primary/15">
                  {activeSlide.number}
                </span>
              )}
              <h5 className="text-balance text-2xl font-black leading-snug tracking-tight text-foreground md:text-3xl">
                {activeSlide.heading}
              </h5>
            </div>

            <ul className="space-y-4">
              {activeSlide.bullets.map((bullet, index) => {
                const [label, body] = splitBulletLabel(bullet);
                return (
                  <li key={index} className="flex gap-3 text-sm leading-7 text-foreground/80 md:text-[15px]">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    {/* Opt out of the global prose reading-width cap so bullets fill the slide. */}
                    <p className="mb-0 max-w-none">
                      {label && <span className="font-bold text-foreground">{label}: </span>}
                      {body}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(slideIndex - 1)}
          disabled={slideIndex === 0}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === slideIndex}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goTo(index)}
              className={
                index === slideIndex
                  ? 'h-2 w-6 rounded-full bg-primary transition-all duration-300'
                  : 'h-2 w-2 rounded-full bg-slate-300 transition-all duration-300 hover:bg-primary/40 dark:bg-slate-700'
              }
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(slideIndex + 1)}
          disabled={slideIndex === totalSlides - 1}
          aria-label="Next slide"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function StoryTherapyPage() {
  const [selectedPrompt, setSelectedPrompt] = React.useState('');
  const [story, setStory] = React.useState('');
  const [savedStories, setSavedStories] = React.useState<Story[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [voiceRecordings, setVoiceRecordings] = React.useState<string[]>([]);
  const [writingTimer, setWritingTimer] = React.useState(0);
  const [isWriting, setIsWriting] = React.useState(false);
  const [storageType, setStorageType] = React.useState<'local' | 'cloud'>('local');
  const [storageProvider, setStorageProvider] = React.useState<IStorageProvider | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedStoryForReading, setSelectedStoryForReading] = React.useState<Story | null>(null);
  const [activeTab, setActiveTab] = React.useState<'stories' | 'divine-comedy'>('stories');
  const [currentChapterIndex, setCurrentChapterIndex] = React.useState(0);

  // Divine Comedy Chapters - Chapter-by-chapter philosophical interpretation inspired by Predictive History
  interface DivineComedyChapter {
    number: number;
    cantica: string;
    title: string;
    theme: string;
    interpretation: string;
    reflection: string;
    keywords: string[];
    tribute?: string;
    predictiveHistoryInsight?: string[];
    videoUrl?: string;
  }

  const divineComedyChapters: DivineComedyChapter[] = [
    {
      number: 1,
      cantica: "Inferno",
      title: "The Dark Forest: Recognizing the Abyss Within",
      theme: "Self-Awareness & Crisis",
      interpretation: `Dante's journey begins in a dark forest, lost and confused. In the context of grief and spiritual crisis, this represents the moment when we can no longer ignore our pain. The forest symbolizes how grief disorients us. We lose our way, surrounded by familiar yet frightening terrain.\n\nThe philosophical meaning: Before transformation can occur, we must acknowledge that we are lost. The "dark forest" is not a punishment but an awakening. Dante's fear and confusion are the catalysts for change. Similarly, in grief, the initial darkness is often the moment when we stop pretending and face reality.\n\nPredictive History's insight: History shows that civilizations and individuals only advance when they confront their deepest crises. The forest represents the crisis point. Denial ends and the journey toward healing begins.`,
      reflection: "When did you realize you were 'lost' in your grief? What did that moment of clarity feel like?",
      keywords: ["Crisis", "Awakening", "Dark night of the soul", "Self-recognition"],
      tribute: `Lost am I, my Lords, and midway gone astray,
my pen still aches with words it cannot say,
their measures cut by antique blades away,
scorched by a fire no mercy will allay.

The dance has been my life, my breath, my creed,
of elves and monsters and the rites they lead,
who wheel through shadowed wood and tangled mead,
while I, bewildered, follow where they bleed.

Aristotle, Socrates, and Beatrice,
three loves that hold my soul and grant no peace,
within this dark abyss that none release,
I speak their names and bid the shadows cease.

I summon all their love into the pit,
where shadows of the ancient evil sit,
that one frail star, long darkened, might be lit,
and guide my steps where Heaven sees them fit.`
    },
    {
      number: 2,
      cantica: "Inferno",
      title: "The Hesitation: Doubt and the Grace That Calls Us Forward",
      theme: "Doubt & Divine Grace",
      interpretation: `As night falls and the journey is about to begin, Dante is seized by doubt. "I am not Aeneas, nor am I Paul," he protests. Who am I to make this journey? His courage fails him at the very threshold. In grief, this is the moment after the first awakening, when the enormity of the road ahead makes us shrink back, certain we are not strong enough, not worthy enough, to heal.\n\nVirgil answers his fear with a story: Dante is not alone. Three blessed women in Heaven, the Virgin Mary, Saint Lucia, and Beatrice, have seen his suffering and set this journey in motion. Beatrice descended even into Limbo to ask Virgil to be his guide. The philosophical meaning: we are called forward not by our own strength but by love that reaches toward us from beyond ourselves. We do not heal alone. We are carried by the love that still holds us, even the love of those we have lost.\n\nPredictive History's insight: No transformation is undertaken in isolation. History's turning points are sustained by unseen networks of care, mentors, ancestors, and communities, that hold a person steady when their own resolve falters. The hesitation is overcome not by erasing doubt, but by remembering we are held.`,
      reflection: "Who or what has 'descended' to reach you in your grief? A person, a memory, a love that still calls you forward? What would it mean to trust that you are being carried?",
      keywords: ["Doubt", "Grace", "Being called", "Not alone", "Courage"],
      tribute: `Love bypasses Heaven
Descends into the earthly realm
Erases fear from Dante's helm
Now he has got noone to blame

Virgil is the messenger of Beatrice
To take Dante away from the earthly Matrix

Beatrice the reflection of Saint Lucia
Sprouting and growing fast like alocasia
Bends down the shadowy shades of heaven
to wake up the ancient poet virgil as a raven

Beatrice is the beaker full of love
overflowing and estatic in her blood
Saint Lucia's favorite vision is in her grub
for dante's pain is hers and in her sob

Saint Lucia's disciple is in rubble
In front of the Hell's reckoning stumbled
The Virgin mary feels lost Dante's trouble
A true testament of faith and love's bubble`
    },
    {
      number: 3,
      cantica: "Inferno",
      title: "The Gate of Hell: Acceptance and the Point of No Return",
      theme: "Acceptance & Commitment",
      interpretation: `At the entrance to Hell stands a gate with an inscription that reads: "Abandon all hope, ye who enter here." This is the moment of absolute threshold. Dante and Virgil stand before the ultimate darkness, and Dante must choose: turn back to the safety of ignorance, or cross the threshold into the unknown.\n\nIn the language of grief, this is the moment when we must accept that we cannot go back to who we were. The person we have lost will not return. The life we had is not coming back. This is not a moment of despair but a moment of profound acceptance. We cross this gate when we stop negotiating with reality and commit to the journey forward.\n\nThe philosophical meaning: The inscription is not a curse but a teaching. To enter the underworld of grief is to release our expectations about how life should be. We abandon the hope that things will return to normal. We abandon the false hope that denial protects us. In exchange, we gain the only authentic hope: the possibility of transformation and integration. We become willing to experience the full depth of what we have lost, because in that depth lies the pathway to wisdom.\n\nInside History's insight: Every civilization that has endured and grown has passed through gates where it had to abandon what no longer served it. The Renaissance was born from those willing to abandon medieval certainties. Nations have been reborn by those willing to cross thresholds of no return. The inscription at Hell's gate is a covenant: nothing will be the same, but you will emerge changed.`,
      reflection: "What have you had to abandon in your grief? What false hopes have you released? What remains on the other side of your threshold?",
      keywords: ["Acceptance", "Letting go", "Threshold", "Commitment", "Integration"],
      tribute: `'Let us not talk of them,but look and pass'
says the ancient poet with aghast 
For charon has fastened his ferry-mast
to voyage into the suffering city at last 

Those who refused to live 'n do their creed
entrenched blind in cowardice's mere greed
shall find their resort here, these drunked mead
for they've wasted and pilaged the Adam's seed

Dante engulfed in earthly empathy 
got emotions metamorphosed into sympathy 
For he is touched deeply and unpleasantly
defeated by pain and beastly apathy

For Dante must cast aside his ego
For his is warned about his mental vertigo
For Dante's will must now overcome this embargo
Is he is to voyage deeper into this limbo?`,
      predictiveHistoryInsight: [
        `The atmosphere shifts from the entrance into a turbid timeless air filled with strange utterances, horrible pronouncements, and accents of anger, creating a chaotic and sensory-overloading experience for Dante.`,
        `Dante is physically and emotionally overwhelmed by the transition. He describes his head as oppressed by horror and asks Virgil for clarity about the souls he hears suffering, showing his human empathy and fear.`,
        `Virgil stays calm and analytical. He explains the geography and the nature of the suffering souls with a clinical, teacher-like authority, creating a sharp contrast with Dante's turmoil.`,
        `The souls in this region are defeated by their pain, and the move into Hell marks a final surrender of human agency and the abandonment of hope or ambition elsewhere in the Divine Comedy.`
      ]
    },
    {
      number: 4,
      cantica: "Inferno",
      title: "Limbo: The Virtuous Souls and the Longing Without Hope",
      theme: "Longing & Virtue",
      interpretation: `Descending into the First Circle, Dante enters Limbo, not a place of torment but of longing. Here dwell the virtuous souls who lived well yet died without baptism: the great poets and philosophers of antiquity. They are not punished with fire or ice. Their only suffering is desire without hope. As Virgil explains, "without hope we live in longing." They gaze eternally toward a light they cannot reach.\n\nIn the language of grief, Limbo is the landscape of suspended mourning, the place where we hold everything good and worthy about the one we have lost, and yet ache with a longing that finds no resolution. It is honor without peace, love without arrival. Dante is welcomed here by Homer, Horace, Ovid, and Lucan, and admitted as the sixth among them. Together they enter a noble castle where Aristotle sits as "the master of those who know," beside Socrates and Plato.\n\nThe philosophical meaning: Limbo asks whether goodness alone is enough, and answers with a tender ambiguity. These souls are honored, luminous, and at rest, yet incomplete. Grief teaches the same paradox. We can carry a love that is whole and beautiful and still live inside its longing. To honor what we have lost is not the same as being released from it.\n\nPredictive History's insight: civilizations are built on the poets and thinkers who came before, the classical foundation that later ages reclaim. Dante does not discard the virtuous pagans. He crowns them, even as he places them beyond salvation. History advances by honoring the inheritance it can never fully return to.`,
      reflection: "What do you carry that is good and whole, yet still aches with longing? Is it possible to honor a love completely and still live inside its desire?",
      keywords: ["Limbo", "Longing", "Virtue", "Honor", "Suspension"],
      tribute: `Dante plays with poets
Placing them in this cantos' riot
Because they lacked baptism's might
So they remain here quiet?

Some souls were saved afterwards
Before they could go astray and haywards
By the resurrected one utopianly
Because they seeked divinity appropriately

Before he could pay homage to homer
Virgil places himself alongside as a roamer
Other gaint shadows take his space - the Horace
N' Ovid 'Avid Arousal of Ars Amatoria' resurface

Wrong place wrong time
Socrates and Plato make the base of the exalted castle sublime
As they march forth they see other greats
'Everything has an end, they say' and this was one of those dire case`,
      predictiveHistoryInsight: [
        `Logic of Perfect Justice & Innocent Souls: Dante's vision of Limbo rests on the premise that God's justice is perfect and logical. Rather than a mechanical exclusion of the unbaptized, seats in the order of Heaven are assigned through reason, love, and virtue, a response to the theological problem of innocent souls who die without baptism.`,
        `Virgil's Choice to Remain in Limbo: A central paradox. Virgil was granted special divine permission and the opportunity to reach Paradise by guiding Dante, yet he is not in Paradise. He remains in Limbo because he chose to stay.`,
        `Classical Poetry vs. Empire: The Great Citadel of Limbo houses the virtuous pagans and poets (Homer, Horace, Ovid, Lucan, Virgil). Poetry is what gives birth to civilization. Greek culture was built on excellence (arete) and flourishing (eudaimonia), while Roman culture shifted toward piety and obedience. Virgil embodies this classical foundation, which Dante reclaims as he confronts both pagan philosophy and the medieval Church.`
      ],
      videoUrl: "https://www.youtube.com/watch?v=e_9fndobOnI&t=11663s"
    },
    {
      number: 5,
      cantica: "Inferno",
      title: "The Wind of Lust: Misdirected Love and Moral Clarity",
      theme: "Desire, Judgment, and Self-Control",
      interpretation: `Canto 5 turns from the threshold of Hell into the storm of the Second Circle, where Minos judges the souls who confess their own lives and are sent where they belong. The encounter reveals that lust is not a random punishment but a condition of love that has lost measure and direction. Desire itself is not the enemy; the danger begins when appetite overrules reason and the soul lets itself be carried without restraint.

    In grief, this chapter mirrors the struggle to tell the difference between what is tender and what is consuming. Dante's pity for Francesca shows how easy it is to confuse sympathy with approval, or beauty with truth. Virgil's role, and Minos' judgment, remind us that moral clarity requires more than feeling. It requires discernment. The storm becomes an image of the mind and body when they are blown by passion without grounding.`,
      reflection: "Where in your life have you felt the difference between love that steadies you and desire that sweeps you away?",
      keywords: ["Lust", "Judgment", "Reason", "Desire", "Discernment"],
      tribute: `Love is a disease that destroys civilization
says Venus the mother of Aeneas
through Virgil's Pen
But the Minos' serpent
is weary of this literature 
So he warns Dante of Virgil's allure

Aenes is trying to destroy the legacy of Dido 
In Virgil's Aeneid by marrying her in an false oath
And sneaking secretly towards Italy henceforth 

Love took hold of dido to destroy Carthage 
Virgil's literature of obedience and peity
denies him the right to be a noble sage
minos warns to trust noone in this cantos' visage

Francesca and her lover had only read the lancelot 
For Dante cannot swallow this love bird's endplot

The difference between love and lust reignite
Something that touches body but doesnot touch the soul quite?`,
      predictiveHistoryInsight: [
        `1. Minos as the Connoisseur of Sin`,
        `The Divine Judge: The professor highlights Minos standing at the entrance of the Second Circle, examining and judging souls as they arrive.`,
        `Confession and Self-Condemnation: The professor notes that the damned souls willingly confess everything to Minos. Their placement in Hell is not an arbitrary punishment forced upon them, but a direct result of their own actions and choices during life.`,
        `2. The Nature of Lust & Misdirected Love`,
        `Incontinence vs. Malice: Canto 5 marks the beginning of the sins of Incontinence (lack of self-control). The professor explains that unlike deliberate evil or violence, lust stems from a natural, primal emotion (love) that has become unregulated and misdirected.`,
        `Subordinating Reason to Appetite: The fundamental definition of lust in Dante's theology is placing physical/carnal desire above rational intellect.`,
        `3. The Contrapasso (The Windstorm)`,
        `Symbolism of the Tempest: The souls in Canto 5 are tossed violently through pitch-black air by ceaseless dark windstorms.`,
        `The Professor's Insight: The professor points out that this punishment directly mirrors their psychological state on Earth: because they allowed themselves to be blown around by the "winds of passion" without rational agency, they are eternally swept around in literal chaos.`,
        `4. The Encounter with Francesca and Paolo`,
        `Romanticized Tragedy vs. Moral Reality: The professor analyzes Dante's interaction with Francesca da Rimini. While Dante feels deep sympathy and pity for her romantic story, the professor points out that Francesca deflects personal responsibility, blaming love itself and the book they were reading (Lancelot) rather than her own choices.`,
        `Dante's Swoon: Dante fainting at the end of Canto 5 reflects his own struggle with romantic poetry and courtly love, realizing how easily human empathy can obscure moral judgment.`
      ],
      videoUrl: "https://youtu.be/e_9fndobOnI?si=zMrvazOsfpJu8qB-"
    },
    {
      number: 6,
      cantica: "Inferno",
      title: "The Third Circle: Gluttony, Cerberus, and the City Undone",
      theme: "Appetite, Isolation, and Civic Decay",
      interpretation: `Canto 6 lowers Dante into the Third Circle, where a cold and filthy rain falls without end and Cerberus, the three-throated beast, claws at souls who can no longer stand upright. Gluttony here is not a matter of the table. It is appetite that has turned inward until it consumes the person holding it. The damned lie flattened in the mud, unable to see one another, each sealed inside a hunger that no amount of consuming will ever close.

    In grief, this circle names a particular danger: the moment sorrow stops being something we carry and becomes something we feed. Numbing has its own appetite, and it isolates. The mourner who disappears into consumption of any kind is not punished by the rain so much as revealed by it. Ciacco extends the diagnosis outward, from one appetite to a whole city, showing that what hollows a person will hollow a community by the same logic. The lesson is not that desire is shameful, but that desire without direction degrades whoever holds it, and eventually everyone around them.`,
      reflection: "What have you reached for to fill the absence, and did it ever actually fill it? What would it mean to sit in the rain without reaching?",
      keywords: ["Gluttony", "Cerberus", "Ciacco", "Contrapasso", "Isolation", "Civic decay"],
      tribute: `Cerberus, the three-throated dog
who tears and flays in this cantos' fog
greets them barking in that grey smog
N' The damned curl spineless like a hedgehog

Eternal rain and hoisting dements their agog
For they were gluttons in their earthly backlog
That thirst cannot be quenched nor unclogged
Here the 'rain grey with filth' fill their shoes,
the imaginative analog

"gluttony, desire turned inward, self-havoc
when widespread consumes a city, amok",
utters Ciacco to Dante in that unclear smoke`,
      predictiveHistoryInsight: [
        `1. Gluttony as Isolation and Degradation`,
        `Beyond Overeating: The professor highlights how gluttony is not merely about overeating, but about an insatiable, self-absorbed desire that degrades human dignity.`,
        `Reduced to the Animal: The souls in the Third Circle lie wallowing in cold, filthy rain and mud, brutalized by Cerberus, illustrating how overindulgence reduces human beings to animalistic self-isolation.`,
        `2. Political Corruption of Florence (Ciacco)`,
        `The First Political Prophecy: Canto 6 introduces Ciacco, who delivers the first major political prophecy regarding the factional conflict and ruin of Florence.`,
        `Appetite Becomes Politics: The professor draws a connection between individual appetite and political greed. When citizens prioritize personal consumption over civic virtue, political chaos and corruption inevitably follow.`,
        `3. Pedagogical Technique (Comparative Punishments)`,
        `Teaching Through Contrast: Toward the end of the lecture, Professor Jiang uses Canto 6 as a primary example for teaching Dante through contrast, prompting the class to evaluate why cold, heavy rain and filth serve as such an effective contrapasso compared to other physical tortures in Inferno.`,
        `Environment as Mirror: The comparison illustrates how the physical environment of each circle mirrors the internal spiritual decay of the souls confined to it.`
      ],
      videoUrl: "https://youtu.be/e_9fndobOnI?si=zMrvazOsfpJu8qB-"
    }
  ];

  const storyPrompts = [
    {
      text: "Write about a memory that brings you comfort",
      category: "Comfort",
      difficulty: "Easy",
      estimated: "10-15 min"
    },
    {
      text: "Tell the story of how you met your loved one",
      category: "Connection",
      difficulty: "Medium", 
      estimated: "15-20 min"
    },
    {
      text: "Describe a perfect day you would spend together",
      category: "Dreams",
      difficulty: "Medium",
      estimated: "20-25 min"
    },
    {
      text: "Write a letter to your future self about this journey",
      category: "Growth",
      difficulty: "Hard",
      estimated: "25-30 min"
    },
    {
      text: "Create a story where your loved one is the hero",
      category: "Honor",
      difficulty: "Hard", 
      estimated: "30+ min"
    },
    {
      text: "Write about a lesson they taught you",
      category: "Wisdom",
      difficulty: "Medium",
      estimated: "15-20 min"
    },
    {
      text: "Describe their laugh and what made them happy",
      category: "Joy",
      difficulty: "Easy",
      estimated: "10-15 min"
    },
    {
      text: "Tell the story of a tradition you shared",
      category: "Tradition",
      difficulty: "Medium",
      estimated: "20-25 min"
    }
  ];

  const [completedPrompts, setCompletedPrompts] = React.useState<Set<string>>(new Set());

  // Initialize storage provider
  React.useEffect(() => {
    const initStorage = async () => {
      try {
        const provider = StorageProviderFactory.createProvider(
          storageType, 
          'story-therapy-stories',
          storageType === 'cloud' ? 'https://api.example.com' : undefined
        );
        setStorageProvider(provider);
        
        // Load saved stories
        const stories = await provider.list<Story>();
        setSavedStories(stories);
        
        // Update completed prompts
        const completed = new Set(stories.map(s => s.prompt));
        setCompletedPrompts(completed);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        // Fallback to local storage if initialization fails
        try {
          const fallbackProvider = StorageProviderFactory.createProvider('local', 'story-therapy-stories', undefined);
          setStorageProvider(fallbackProvider);
          const stories = await fallbackProvider.list<Story>();
          setSavedStories(stories);
          const completed = new Set(stories.map(s => s.prompt));
          setCompletedPrompts(completed);
        } catch (fallbackError) {
          console.error('Fallback storage initialization also failed:', fallbackError);
        }
        setIsLoading(false);
      }
    };

    initStorage();
  }, [storageType]);

  // Writing timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWriting) {
      interval = setInterval(() => {
        setWritingTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWriting]);

  // Recording timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Track writing activity
  React.useEffect(() => {
    if (story.length > 0 && !isWriting) {
      setIsWriting(true);
    } else if (story.length === 0 && isWriting) {
      setIsWriting(false);
      setWritingTimer(0);
    }
  }, [story, isWriting]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200/50';
      case 'Medium': return 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200/50';
      case 'Hard': return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200/50';
      default: return 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200/50';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Comfort': 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50',
      'Connection': 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/50',
      'Dreams': 'bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200/50',
      'Growth': 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50',
      'Honor': 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50',
      'Wisdom': 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50',
      'Joy': 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200/50',
      'Tradition': 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200/50'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100/80 text-gray-700 border border-gray-200/50';
  };

  const handleSaveStory = async () => {
    if (!story.trim()) {
      alert('Please write a story before saving.');
      return;
    }
    if (!selectedPrompt) {
      alert('Please select a prompt before saving.');
      return;
    }
    if (!storageProvider) {
      alert('Storage not available. Please try again.');
      return;
    }
    
    try {
      const newStory: Omit<Story, 'id' | 'createdAt' | 'updatedAt'> = {
        prompt: selectedPrompt,
        content: story,
        wordCount: story.trim().split(/\s+/).length,
        timeSpent: writingTimer,
        savedAt: new Date().toLocaleDateString(),
        category: storyPrompts.find(p => p.text === selectedPrompt)?.category || 'Unknown'
      };
      
      const savedStory = await storageProvider.save(newStory as Story);
      setSavedStories([...savedStories, savedStory]);
      setCompletedPrompts(new Set([...completedPrompts, selectedPrompt]));
      setStory('');
      setSelectedPrompt('');
      setIsWriting(false);
      setWritingTimer(0);
      alert('Story saved successfully!');
    } catch (error) {
      console.error('Failed to save story:', error);
      alert(`Failed to save story: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleStorageTypeChange = (newType: 'local' | 'cloud') => {
    if (storageType !== newType) {
      setStorageType(newType);
      setIsLoading(true);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    const recordingName = `Voice Story ${voiceRecordings.length + 1} (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`;
    setVoiceRecordings([...voiceRecordings, recordingName]);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completionPercentage = (completedPrompts.size / storyPrompts.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link to="/therapy">
          <Button variant="outline" size="sm" className="rounded-full shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Therapy
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-semibold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            📖 Story Therapy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Heal through the power of storytelling and narrative
          </p>
          {/* Tab Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'stories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('stories')}
              className="rounded-full"
            >
              Story Prompts
            </Button>
            <Button
              variant={activeTab === 'divine-comedy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('divine-comedy')}
              className="rounded-full"
            >
              Divine Comedy
            </Button>
          </div>
        </div>
        
        {/* Storage Type Toggle */}
        <div className="flex items-center space-x-2 bg-muted/30 rounded-full p-1">
          <Button
            variant={storageType === 'local' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleStorageTypeChange('local')}
            className="rounded-full"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Local
          </Button>
          <Button
            variant={storageType === 'cloud' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleStorageTypeChange('cloud')}
            className="rounded-full"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Cloud
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 hover-lift border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            <span>Your Story Journey</span>
          </CardTitle>
          <CardDescription className="text-base">
            {completedPrompts.size} of {storyPrompts.length} prompts completed • {storageType === 'local' ? 'Stored locally' : 'Synced to cloud'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3 mb-3 rounded-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(completionPercentage)}% Complete</span>
            <span>{savedStories.length} stories saved</span>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <Card className="lg:col-span-1 hover-lift">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Story Prompts</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choose a prompt to begin your therapeutic storytelling session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[28rem] sm:max-h-96 overflow-y-auto">
            {storyPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant={selectedPrompt === prompt.text ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-soft hover:scale-[1.02]"
                onClick={() => setSelectedPrompt(prompt.text)}
              >
                <div className="w-full min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <Badge className={`${getCategoryColor(prompt.category)} rounded-full px-2 sm:px-3 py-1 text-xs`}>
                      {prompt.category}
                    </Badge>
                    {completedPrompts.has(prompt.text) && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium mb-2 leading-relaxed break-words">{prompt.text}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className={`${getDifficultyColor(prompt.difficulty)} rounded-full`}>
                      {prompt.difficulty}
                    </Badge>
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {prompt.estimated}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Your Story</CardTitle>
                <CardDescription className="text-base">
                  {selectedPrompt || "Select a prompt to begin writing"}
                </CardDescription>
              </div>
              {isWriting && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(writingTimer)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Start writing your story here..."
              className="min-h-80 rounded-2xl border-2 focus:border-primary/40 transition-all duration-300 resize-none leading-loose"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              disabled={!selectedPrompt}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="space-x-2">
                  <Button 
                    disabled={!story.trim() || !selectedPrompt}
                    onClick={handleSaveStory}
                    className="rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Story
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStory('');
                      setIsWriting(false);
                      setWritingTimer(0);
                    }}
                    className="rounded-full hover:bg-accent/20 transition-all duration-300"
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="border-l border-border pl-4">
                  {isRecording ? (
                    <Button variant="destructive" onClick={stopVoiceRecording} className="rounded-full">
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop ({formatTime(recordingTime)})
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={startVoiceRecording} className="rounded-full hover:bg-accent/20 transition-all duration-300">
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Record
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {story.length} characters • {story.trim() ? story.trim().split(/\s+/).length : 0} words
              </div>
            </div>

            {voiceRecordings.length > 0 && (
              <div className="border-t pt-4 border-border">
                <h4 className="font-medium mb-3 text-lg">Voice Recordings:</h4>
                <div className="space-y-2">
                  {voiceRecordings.map((recording, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl text-sm hover:bg-muted/50 transition-all duration-300">
                      <span>{recording}</span>
                      <Button size="sm" variant="ghost" className="rounded-full">Play</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Divine Comedy Section */}
      {activeTab === 'divine-comedy' && (
      <div className="space-y-6">
        {divineComedyChapters.length > 0 && (
          <>
            <Card key={divineComedyChapters[currentChapterIndex].number} className="hover-lift">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary/20 text-primary rounded-full px-3 py-1">
                    {divineComedyChapters[currentChapterIndex].cantica}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    Chapter {divineComedyChapters[currentChapterIndex].number}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{divineComedyChapters[currentChapterIndex].title}</CardTitle>
                <CardDescription className="text-base">
                  <span className="font-semibold text-foreground">Theme:</span> {divineComedyChapters[currentChapterIndex].theme}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Philosophical Interpretation</h4>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {divineComedyChapters[currentChapterIndex].interpretation}
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h4 className="font-semibold mb-2">Reflection Prompt</h4>
                  <p className="text-foreground/70 italic">{divineComedyChapters[currentChapterIndex].reflection}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {divineComedyChapters[currentChapterIndex].keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="rounded-full bg-accent/10">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                {divineComedyChapters[currentChapterIndex].tribute && (
                  <div className="bg-accent/5 rounded-lg p-6 border border-accent/20">
                    <h4 className="font-semibold text-lg mb-4">A Tribute</h4>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap italic font-serif">
                      {divineComedyChapters[currentChapterIndex].tribute}
                    </p>
                  </div>
                )}
                {divineComedyChapters[currentChapterIndex].predictiveHistoryInsight && (
                  <PredictiveHistoryDeck
                    insights={divineComedyChapters[currentChapterIndex].predictiveHistoryInsight}
                    cantica={divineComedyChapters[currentChapterIndex].cantica}
                    chapterNumber={divineComedyChapters[currentChapterIndex].number}
                    chapterTitle={divineComedyChapters[currentChapterIndex].title}
                  />
                )}
                <div className="border-t pt-4 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <a
                    href="https://digitaldante.columbia.edu/dante/divine-comedy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-300"
                  >
                    Read full text on Digital Dante
                  </a>
                  {divineComedyChapters[currentChapterIndex].videoUrl && (
                    <a
                      href={divineComedyChapters[currentChapterIndex].videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-300"
                    >
                      🎥 Watch the lecture on YouTube
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 border-t pt-6 mt-6">
                  <Button 
                    onClick={() => setCurrentChapterIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentChapterIndex === 0}
                    variant="outline"
                  >
                    Previous Chapter
                  </Button>
                  
                  <div className="text-sm text-foreground/60 font-medium">
                    Chapter {currentChapterIndex + 1} of {divineComedyChapters.length}
                  </div>
                  
                  <Button 
                    onClick={() => setCurrentChapterIndex(prev => Math.min(divineComedyChapters.length - 1, prev + 1))}
                    disabled={currentChapterIndex === divineComedyChapters.length - 1}
                  >
                    Next Chapter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      )}

      {/* Saved Stories */}
      {activeTab === 'stories' && savedStories.length > 0 && (
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-2xl">Your Story Collection</CardTitle>
            <CardDescription className="text-base">
              Your completed stories and reflections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedStories.map((story) => (
                <Card key={story.id} className="hover:shadow-soft-lg transition-all duration-300 border-2 hover:border-accent/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getCategoryColor(story.category)} rounded-full px-3 py-1`}>
                        {story.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{story.savedAt}</span>
                    </div>
                    <CardTitle className="text-base line-clamp-2 leading-relaxed">
                      {story.prompt}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground space-y-2">
                      <div>{story.wordCount} words</div>
                      <div>Writing time: {formatTime(story.timeSpent)}</div>
                      <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                         {story.content}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-4 rounded-full hover:bg-accent/20 transition-all duration-300" onClick={() => setSelectedStoryForReading(story)}>
                      Read Full Story
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Reading Modal */}
      <Dialog open={selectedStoryForReading !== null} onOpenChange={(open) => !open && setSelectedStoryForReading(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedStoryForReading?.prompt}</DialogTitle>
            <DialogDescription>View your saved story</DialogDescription>
            <div className="flex gap-4 items-center pt-2">
              <Badge className={`${getCategoryColor(selectedStoryForReading?.category || '')} rounded-full`}>
                {selectedStoryForReading?.category}
              </Badge>
              <span className="text-sm text-muted-foreground">{selectedStoryForReading?.savedAt}</span>
            </div>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="flex gap-6 text-sm text-muted-foreground pb-4 border-b">
              <div>
                <span className="font-semibold text-foreground">{selectedStoryForReading?.wordCount}</span> words
              </div>
              <div>
                <span className="font-semibold text-foreground">{selectedStoryForReading && formatTime(selectedStoryForReading.timeSpent)}</span> writing time
              </div>
            </div>
            <p className="text-base whitespace-pre-wrap leading-relaxed text-foreground">
              {selectedStoryForReading?.content}
            </p>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelectedStoryForReading(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
