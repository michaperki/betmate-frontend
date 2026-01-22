import React from 'react';
import Button from '../Button';
import './style.scss';

const ButtonDemo: React.FC = () => {
  return (
    <div className="button-demo">
      <h2 className="button-demo__title">Button Component Demo</h2>
      
      <section className="button-demo__section">
        <h3 className="button-demo__section-title">Button Variants</h3>
        <div className="button-demo__row">
          <div className="button-demo__item">
            <Button variant="primary">Primary</Button>
            <span className="button-demo__label">Primary</span>
          </div>
          <div className="button-demo__item">
            <Button variant="secondary">Secondary</Button>
            <span className="button-demo__label">Secondary</span>
          </div>
          <div className="button-demo__item">
            <Button variant="ghost">Ghost</Button>
            <span className="button-demo__label">Ghost</span>
          </div>
          <div className="button-demo__item">
            <Button variant="danger">Danger</Button>
            <span className="button-demo__label">Danger</span>
          </div>
          <div className="button-demo__item">
            <Button variant="success">Success</Button>
            <span className="button-demo__label">Success</span>
          </div>
        </div>
      </section>
      
      <section className="button-demo__section">
        <h3 className="button-demo__section-title">Button Sizes</h3>
        <div className="button-demo__row">
          <div className="button-demo__item">
            <Button size="sm">Small</Button>
            <span className="button-demo__label">Small</span>
          </div>
          <div className="button-demo__item">
            <Button size="md">Medium</Button>
            <span className="button-demo__label">Medium</span>
          </div>
          <div className="button-demo__item">
            <Button size="lg">Large</Button>
            <span className="button-demo__label">Large</span>
          </div>
        </div>
      </section>
      
      <section className="button-demo__section">
        <h3 className="button-demo__section-title">Button States</h3>
        <div className="button-demo__row">
          <div className="button-demo__item">
            <Button>Default</Button>
            <span className="button-demo__label">Default</span>
          </div>
          <div className="button-demo__item">
            <Button disabled>Disabled</Button>
            <span className="button-demo__label">Disabled</span>
          </div>
          <div className="button-demo__item">
            <Button loading>Loading</Button>
            <span className="button-demo__label">Loading</span>
          </div>
        </div>
      </section>
      
      <section className="button-demo__section">
        <h3 className="button-demo__section-title">Full Width Buttons</h3>
        <div className="button-demo__column">
          <Button fullWidth variant="primary">Full Width Primary</Button>
          <Button fullWidth variant="secondary" className="button-demo__spaced">Full Width Secondary</Button>
          <Button fullWidth variant="ghost" className="button-demo__spaced">Full Width Ghost</Button>
        </div>
      </section>
      
      <section className="button-demo__section">
        <h3 className="button-demo__section-title">Icon Buttons</h3>
        <div className="button-demo__row">
          <div className="button-demo__item">
            <Button 
              icon={<span className="btn-icon">🔍</span>}
              iconPosition="left"
            >
              Search
            </Button>
            <span className="button-demo__label">Left Icon</span>
          </div>
          <div className="button-demo__item">
            <Button 
              icon={<span className="btn-icon">➡️</span>}
              iconPosition="right"
            >
              Next
            </Button>
            <span className="button-demo__label">Right Icon</span>
          </div>
          <div className="button-demo__item">
            <Button 
              icon={<span className="btn-icon">❤️</span>}
              variant="secondary"
            />
            <span className="button-demo__label">Icon Only</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ButtonDemo;