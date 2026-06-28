import { OWNER_ROUTES } from './routes';

describe('Owner routes', () => {
  it('keeps owner overview and tenant management routes path based', () => {
    const paths = OWNER_ROUTES.map((route) => route.path);

    expect(paths).toContain('overview');
    expect(paths).toContain('tenants');
    expect(paths).toContain('tenants/:id');
  });
});
