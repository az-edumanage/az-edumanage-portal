import { TenantRoomBookingStore } from './tenant-room-booking.store';

describe('TenantRoomBookingStore', () => {
  it('sets room identity and task id', () => {
    const store = new TenantRoomBookingStore();

    store.setRoomId('7');

    expect(store.roomId()).toBe('7');
    expect(store.taskId()).toBe('booking-room-7');
  });
});
