import { createRng, randomSeed } from '@engine/rng';
import {
  clearProfile,
  emptyProfile,
  loadProfile,
  recordCheckpoint,
  recordReview,
  recordRun,
  saveProfile,
  type Profile,
} from '@engine/profile';
import { Session } from '@engine/session';
import type { FaultId, MeasurementId } from '@games/hvac/system';
import { ServiceCallRun, generateServiceCall } from '@games/hvac/servicecall';
import type { Response, Track } from '@engine/types';
import { ALL_QUESTIONS, TRACKS, trackById } from '@content/index';
import { clear, h } from './dom';
import { buildMixedDrill, buildSession, type ModeId } from './modes';
import { renderHome } from './screens/home';
import { renderPlay, resetDraft } from './screens/play';
import { renderResults } from './screens/results';
import { renderAudit, renderProgress } from './screens/reports';
import { renderSectorMap } from './screens/sectormap';
import { renderServiceCall } from './screens/servicecall';

type Screen =
  | { name: 'home' }
  | { name: 'play' }
  | { name: 'results'; previousBest: number }
  | { name: 'progress' }
  | { name: 'audit' }
  | { name: 'service-call' };

const TRACK_KEY = 'netplus-trainer:track';

/**
 * Application shell.
 *
 * Deliberately a plain class with a full re-render on each state change. The app
 * is small, the DOM is small, and the alternative — incremental updates — would
 * buy nothing but bugs at this size.
 */
export class App {
  private readonly root: HTMLElement;
  private profile: Profile;
  private track: Track;
  private screen: Screen = { name: 'home' };

  private session: Session | undefined;
  private call: ServiceCallRun | undefined;
  private mode: ModeId = 'drill';
  private domain: string | undefined;
  private seed = randomSeed();
  private shuffleSeed = randomSeed();
  private timer: number | undefined;

  constructor(root: HTMLElement) {
    this.root = root;
    this.profile = loadProfile();

    const savedTrack = safeGet(TRACK_KEY);
    this.track = (savedTrack ? trackById(savedTrack) : undefined) ?? TRACKS[0]!;

    window.addEventListener('keydown', this.onKeydown);
    this.render();
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  private render = (): void => {
    clear(this.root);

    switch (this.screen.name) {
      case 'home':
        this.stopTimer();
        // A track with sectors gets the guided path; one without gets the flat
        // mode grid. Network+ domains are independent, HVAC's are not.
        this.root.appendChild(
          this.track.sectors && this.track.sectors.length > 0
            ? renderSectorMap({
                track: this.track,
                tracks: TRACKS,
                pool: ALL_QUESTIONS,
                profile: this.profile,
                onStartDrill: (sectorId) => this.start('drill', sectorId),
                onStartCheckpoint: (sectorId) => this.start('checkpoint', sectorId),
                onStartLab: (mode) =>
                  mode === 'service-call' ? this.startServiceCall() : this.start(mode),
                onStartMixed: this.startMixed,
                onStartWeak: () => this.start('weak'),
                onSelectTrack: this.selectTrack,
                onShowProgress: () => this.goto({ name: 'progress' }),
                onShowAudit: () => this.goto({ name: 'audit' }),
              })
            : renderHome({
                track: this.track,
                tracks: TRACKS,
                pool: ALL_QUESTIONS,
                profile: this.profile,
                onStart: this.start,
                onSelectTrack: this.selectTrack,
                onShowProgress: () => this.goto({ name: 'progress' }),
                onShowAudit: () => this.goto({ name: 'audit' }),
              }),
        );
        break;

      case 'service-call': {
        if (!this.call) return this.goto({ name: 'home' });
        this.root.appendChild(
          renderServiceCall({
            run: this.call,
            onMeasure: this.measure,
            onDiagnose: this.diagnose,
            onReplay: this.startServiceCall,
            onHome: () => this.goto({ name: 'home' }),
          }),
        );
        break;
      }

      case 'play': {
        if (!this.session) return this.goto({ name: 'home' });
        this.root.appendChild(
          renderPlay({
            session: this.session,
            mode: this.mode,
            shuffleSeed: this.shuffleSeed,
            onAnswer: this.answer,
            onNext: this.next,
            onSkip: this.skip,
            onQuit: this.finishRun,
            rerender: this.render,
          }),
        );
        break;
      }

      case 'results': {
        if (!this.session) return this.goto({ name: 'home' });
        this.stopTimer();
        this.root.appendChild(
          renderResults({
            snapshot: this.session.snapshot(),
            mode: this.mode,
            seed: this.seed,
            previousBest: this.screen.previousBest,
            onReplay: () => this.start(this.mode, this.domain),
            onHome: () => this.goto({ name: 'home' }),
          }),
        );
        break;
      }

      case 'progress':
      case 'audit': {
        const context = {
          track: this.track,
          pool: ALL_QUESTIONS,
          profile: this.profile,
          onHome: () => this.goto({ name: 'home' }),
          onReset: this.resetProgress,
        };
        this.root.appendChild(
          this.screen.name === 'progress' ? renderProgress(context) : renderAudit(context),
        );
        break;
      }
    }
  };

  private goto(screen: Screen): void {
    this.screen = screen;
    this.render();
  }

  // -------------------------------------------------------------------------
  // Session lifecycle
  // -------------------------------------------------------------------------

  /** A service call runs its own screen and state machine, not a question session. */
  private startServiceCall = (): void => {
    this.mode = 'service-call';
    this.seed = randomSeed();
    this.call = new ServiceCallRun(generateServiceCall(createRng(this.seed)));
    this.goto({ name: 'service-call' });
  };

  private measure = (id: MeasurementId): void => {
    this.call?.measure(id);
    this.render();
  };

  private diagnose = (id: FaultId): void => {
    if (!this.call) return;
    const outcome = this.call.diagnose(id);

    this.profile = recordRun(
      this.profile,
      {
        mode: 'service-call',
        track: this.track.id,
        at: Date.now(),
        score: outcome.points,
        asked: 1,
        correct: outcome.correct ? 1 : 0,
      },
      0,
    );
    saveProfile(this.profile);
    this.render();
  };

  private startMixed = (): void => {
    this.mode = 'drill';
    this.domain = undefined;
    this.seed = randomSeed();
    this.shuffleSeed = randomSeed();

    const built = buildMixedDrill(this.seed);
    this.session = new Session(built.config);
    resetDraft();
    this.stopTimer();
    this.goto({ name: 'play' });
  };

  private start = (mode: ModeId, domain?: string): void => {
    if (mode === 'service-call') return this.startServiceCall();

    this.mode = mode;
    this.domain = domain;
    this.seed = randomSeed();
    this.shuffleSeed = randomSeed();

    const built = buildSession({
      mode,
      track: this.track,
      pool: ALL_QUESTIONS,
      profile: this.profile,
      seed: this.seed,
      ...(domain ? { domain } : {}),
    });

    if (built.config.questions.length === 0) {
      this.goto({ name: 'home' });
      return;
    }

    this.seed = built.seed;
    this.session = new Session(built.config);
    resetDraft();
    this.startTimerIfNeeded();
    this.goto({ name: 'play' });
  };

  private answer = (response: Response): void => {
    if (!this.session) return;
    const snap = this.session.snapshot();
    const question = snap.question;
    if (!question) return;

    const judgement = this.session.answer(response);

    // Generated questions are not tracked by the scheduler — their ids embed a
    // seed and would never be seen twice, so they would only bloat the profile.
    if (question.source.kind !== 'generated') {
      this.profile = recordReview(this.profile, question.id, judgement.credit, Date.now());
      saveProfile(this.profile);
    }

    if (this.session.snapshot().phase === 'finished') this.finishRun();
    else this.render();
  };

  private next = (): void => {
    if (!this.session) return;
    this.session.next();
    resetDraft();
    this.shuffleSeed = randomSeed();

    if (this.session.snapshot().phase === 'finished') this.finishRun();
    else this.render();
  };

  private skip = (): void => {
    if (!this.session) return;
    this.session.skip();
    if (this.session.snapshot().phase === 'finished') this.finishRun();
    else this.render();
  };

  private finishRun = (): void => {
    if (!this.session) return;
    this.stopTimer();
    this.session.finish();

    const snap = this.session.snapshot();
    const previousBest = this.profile.bests[this.mode] ?? 0;
    const asked = snap.answered.length;
    const graded = this.mode === 'exam' || this.mode === 'checkpoint';

    if (asked > 0) {
      const percent = Math.round((snap.correctCount / asked) * 100);

      this.profile = recordRun(
        this.profile,
        {
          mode: this.mode,
          track: this.track.id,
          at: Date.now(),
          score: snap.score,
          asked,
          correct: snap.correctCount,
          ...(graded ? { percent } : {}),
        },
        snap.bestStreak,
      );

      // A checkpoint is scored against the whole sector, so an abandoned run
      // counts every unanswered question as missed — otherwise quitting after
      // two right answers would read as 100%.
      if (this.mode === 'checkpoint' && this.domain) {
        const sector = this.track.sectors?.find((s) => s.id === this.domain);
        if (sector) {
          const total = Math.max(asked, snap.total);
          const sectorPercent = Math.round((snap.correctCount / total) * 100);
          this.profile = recordCheckpoint(
            this.profile,
            sector.id,
            sectorPercent,
            sector.checkpoint.passPercent,
            Date.now(),
          );
        }
      }

      saveProfile(this.profile);
    }

    this.goto({ name: 'results', previousBest });
  };

  // -------------------------------------------------------------------------
  // Timer
  // -------------------------------------------------------------------------

  private startTimerIfNeeded(): void {
    this.stopTimer();
    if (this.session?.timeLeftSec() === undefined) return;

    this.timer = window.setInterval(() => {
      if (!this.session) return this.stopTimer();
      if ((this.session.timeLeftSec() ?? 1) <= 0) {
        this.finishRun();
        return;
      }
      // Only the HUD changes each tick, but a full re-render at 1 Hz is cheap
      // and keeps the single-source-of-truth rendering model intact.
      if (this.screen.name === 'play') this.render();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  // -------------------------------------------------------------------------
  // Misc
  // -------------------------------------------------------------------------

  private selectTrack = (trackId: string): void => {
    const found = trackById(trackId);
    if (!found) return;
    this.track = found;
    safeSet(TRACK_KEY, trackId);
    this.render();
  };

  private resetProgress = (): void => {
    clearProfile();
    this.profile = emptyProfile();
    this.render();
  };

  /**
   * Keyboard control. Number keys pick an option, Enter advances, S skips.
   * Typing in a text field is left alone.
   */
  private onKeydown = (event: KeyboardEvent): void => {
    if (this.screen.name !== 'play' || !this.session) return;
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

    const snap = this.session.snapshot();

    if (event.key === 'Enter') {
      if (snap.phase === 'revealed') {
        event.preventDefault();
        this.next();
      }
      return;
    }

    if (event.key.toLowerCase() === 's' && snap.phase === 'asking') {
      event.preventDefault();
      this.skip();
      return;
    }

    if (snap.phase !== 'asking' || !snap.question) return;

    const digit = Number(event.key);
    if (!Number.isInteger(digit) || digit < 1) return;

    const buttons = this.root.querySelectorAll<HTMLButtonElement>('.choice, .match-item');
    const button = buttons[digit - 1];
    if (button && !button.disabled) {
      event.preventDefault();
      button.click();
    }
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing. Not worth surfacing.
  }
}

export function mount(root: HTMLElement): App {
  return new App(root);
}

export { h };
