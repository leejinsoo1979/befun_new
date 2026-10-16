import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { backExample, backPanelPose, backPanelSteps, backPanelShot, rearDisplayClearance } from './backPanel.ts';

test('fixed pins install before spring compression; panel straightens before spring return', () => {
  assert.ok(backPanelPose(2, 1).pivot[1] > 0);
  assert.equal(backPanelPose(3, 1).springExtension, 0);
  assert.equal(backPanelPose(4, 1).tilt, 0);
  assert.equal(backPanelPose(4, 1).springExtension, 0);
  assert.equal(backPanelPose(5, 1).springExtension, backExample.pinLength);
});

test('pivot and pin motion are continuous, and the lower rear corner stays on the base while turning', () => {
  for (let step = 0; step < backPanelSteps.length - 1; step++) {
    const before = backPanelPose(step, 1), after = backPanelPose(step + 1, 0);
    assert.deepEqual(before.pivot, after.pivot);
    assert.equal(before.tilt, after.tilt);
    assert.equal(before.springExtension, after.springExtension);
  }
  for (let p = 0; p <= 1; p += .01) {
    const pose = backPanelPose(4, p);
    const corner = new Vector3(0, 0, -backExample.thickness / 2).applyAxisAngle(new Vector3(1, 0, 0), pose.tilt).add(new Vector3(...pose.pivot));
    assert.ok(corner.distanceTo(new Vector3(0, 0, -backExample.thickness / 2)) < 1e-8);
    assert.equal(pose.springExtension, 0);
    assert.ok(backExample.height * Math.cos(pose.tilt) <= backExample.height + 1e-9);
  }
});

test('macro cameras follow the actual top pin while the panel rotates on desktop and mobile', () => {
  for (const aspect of [.42, 1, 2]) for (let step = 0; step < backPanelSteps.length; step++) {
    for (const p of [0, .5, 1]) {
      const shot = backPanelShot(step, p, aspect, false, false);
      assert.ok([...shot.target, ...shot.position].every(Number.isFinite));
      if (backPanelSteps[step].view === 'back-top') {
        const pose = backPanelPose(step, p);
        assert.equal(shot.target[1], (backExample.height - rearDisplayClearance) * Math.cos(pose.tilt) + pose.pivot[1]);
      }
    }
  }
});

test('the example approaches from outside the cabinet and clears the top before lower pin insertion', () => {
  for (let p = 0; p <= 1; p += .01) {
    const pose = backPanelPose(1, p);
    const topY = pose.pivot[1] + (backExample.height + backExample.pinLength) * Math.cos(pose.tilt);
    const topZ = pose.pivot[2] + (backExample.height + backExample.pinLength) * Math.sin(pose.tilt);
    if (topZ >= -6) assert.ok(topY < backExample.height, 'upper pins must clear the top board when they enter from behind');
  }
});
