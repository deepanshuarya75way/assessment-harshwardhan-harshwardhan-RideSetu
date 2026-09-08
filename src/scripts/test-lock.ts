const vehicleQueues = new Map<string, Promise<void>>();

async function acquireVehicleLock(vehicleId: string): Promise<() => void> {
  const currentLock = vehicleQueues.get(vehicleId) || Promise.resolve();
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  const tailPromise = currentLock.then(() => nextLock, () => nextLock);
  vehicleQueues.set(vehicleId, tailPromise);

  await currentLock.catch(() => {});

  return () => {
    release();
    if (vehicleQueues.get(vehicleId) === tailPromise) {
      vehicleQueues.delete(vehicleId);
    }
  };
}

async function run() {
  console.log('Testing async lock with 10 concurrent calls...');
  const order: number[] = [];
  const promises = Array.from({ length: 10 }, async (_, i) => {
    const unlock = await acquireVehicleLock('veh-1');
    order.push(i);
    await new Promise((r) => setTimeout(r, 20));
    unlock();
  });
  await Promise.all(promises);
  console.log('Finished! Order:', order);
}

run();
