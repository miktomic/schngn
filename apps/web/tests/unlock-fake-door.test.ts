import { describe, expect, test } from 'bun:test';
import {
  UNLOCK_PRICE_STORAGE_KEY,
  buildUnlockBuyIntentEvent,
  buildUnlockFakeDoorState,
  chooseUnlockPriceBucket,
  loadOrAssignUnlockPriceBucket,
  type UnlockMarket
} from '../src/lib/fake-door/unlockFakeDoor';

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('paid unlock fake-door price buckets', () => {
  test('assigns approved EU and UK buckets from an injected random value', () => {
    expect(chooseUnlockPriceBucket('eu', 0)).toEqual({ bucket: 'eur_5', label: '€5' });
    expect(chooseUnlockPriceBucket('eu', 0.34)).toEqual({ bucket: 'eur_9', label: '€9' });
    expect(chooseUnlockPriceBucket('eu', 0.99)).toEqual({ bucket: 'eur_19', label: '€19' });

    expect(chooseUnlockPriceBucket('uk', 0)).toEqual({ bucket: 'gbp_5', label: '£5' });
    expect(chooseUnlockPriceBucket('uk', 0.34)).toEqual({ bucket: 'gbp_9', label: '£9' });
    expect(chooseUnlockPriceBucket('uk', 0.99)).toEqual({ bucket: 'gbp_19', label: '£19' });
  });

  test('persists the assigned bucket across reloads', () => {
    const storage = new MemoryStorage();
    const first = loadOrAssignUnlockPriceBucket(storage, { market: 'eu', random: () => 0.99 });
    const second = loadOrAssignUnlockPriceBucket(storage, { market: 'eu', random: () => 0 });

    expect(first).toEqual({ bucket: 'eur_19', label: '€19' });
    expect(second).toEqual(first);
    expect(storage.getItem(UNLOCK_PRICE_STORAGE_KEY)).toBe('eur_19');
  });

  test('ignores invalid persisted values and reassigns for the requested market', () => {
    const storage = new MemoryStorage();
    storage.setItem(UNLOCK_PRICE_STORAGE_KEY, '2026-09-15');

    expect(loadOrAssignUnlockPriceBucket(storage, { market: 'uk', random: () => 0.34 })).toEqual({
      bucket: 'gbp_9',
      label: '£9'
    });
  });

  test('builds premium framing and aggregate-only unlock intent event', () => {
    const price = chooseUnlockPriceBucket('eu' satisfies UnlockMarket, 0.34);

    expect(buildUnlockFakeDoorState(price, false)).toEqual({
      buttonLabel: 'Unlock full trip planner — €9',
      helperCopy: 'The full planner is not live yet. Sign up to save your trips; no payment is taken.',
      messageTitle: 'Full planner is not live yet',
      messageCopy: 'Sign up to keep your trips for repeat visits. SCHNGN records the selected price bucket only and does not charge you.',
      showIntentMessage: false
    });
    expect(buildUnlockFakeDoorState(price, true).showIntentMessage).toBe(true);

    const event = buildUnlockBuyIntentEvent(price, 'planner');
    expect(event).toEqual({
      name: 'unlock_buy_intent',
      props: {
        source: 'planner',
        price_bucket: 'eur_9'
      }
    });
    expect(JSON.stringify(event)).not.toContain('2026-');
    expect(JSON.stringify(event)).not.toContain('Italy');
    expect(JSON.stringify(event)).not.toContain('@');
  });
});
