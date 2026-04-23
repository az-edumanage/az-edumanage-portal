import { Injectable, signal } from '@angular/core';
import { Integration } from '../models/owner-integrations.models';

@Injectable({ providedIn: 'root' })
export class OwnerIntegrationsDataService {
  readonly integrations = signal<Integration[]>([
    {
      id: 'int-stripe',
      name: 'Stripe Payments',
      provider: 'Stripe',
      type: 'Payment',
      status: 'Connected',
      mode: 'Live',
      lastHealthCheck: '2 mins ago',
      icon: 'payments',
      description: 'Process credit card payments and manage subscriptions.',
    },
    {
      id: 'int-twilio',
      name: 'Twilio SMS',
      provider: 'Twilio',
      type: 'SMS',
      status: 'Connected',
      mode: 'Live',
      lastHealthCheck: '1 hour ago',
      icon: 'sms',
      description: 'Send automated SMS notifications and alerts.',
    },
    {
      id: 'int-sendgrid',
      name: 'SendGrid Email',
      provider: 'SendGrid',
      type: 'Email',
      status: 'Connected',
      mode: 'Live',
      lastHealthCheck: '5 mins ago',
      icon: 'mail',
      description: 'Transactional email delivery service.',
    },
    {
      id: 'int-aws-s3',
      name: 'AWS S3 Storage',
      provider: 'Amazon Web Services',
      type: 'Storage',
      status: 'Connected',
      mode: 'Live',
      lastHealthCheck: '10 mins ago',
      icon: 'cloud',
      description: 'Scalable object storage for files and backups.',
    },
    {
      id: 'int-auth0',
      name: 'Auth0 Identity',
      provider: 'Auth0',
      type: 'Identity',
      status: 'Not Configured',
      mode: 'Test',
      lastHealthCheck: 'Never',
      icon: 'fingerprint',
      description: 'Universal authentication and authorization platform.',
    },
    {
      id: 'int-whatsapp',
      name: 'WhatsApp Business',
      provider: 'Meta',
      type: 'SMS',
      status: 'Error',
      mode: 'Test',
      lastHealthCheck: '1 day ago',
      icon: 'chat',
      description: 'Engage customers on WhatsApp.',
    },
  ]);
}
