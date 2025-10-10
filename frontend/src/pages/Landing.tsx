import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/alphayield-logo.png" alt="AlphaYield Logo" className="h-16 w-16" />
          <h1 className="text-2xl font-bold gradient-text">AlphaYield</h1>
        </div>
        <Link to="/app">
          <Button variant="outline" className="gap-2">
            Launch App
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            AI-Powered{' '}
            <span className="gradient-text">Yield Aggregator</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Maximize your DeFi returns with intelligent, automated yield strategies
            powered by advanced AI algorithms on U2U Solaris Mainnet.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/app">
              <Button size="lg" className="gap-2 bg-gradient-hero hover:opacity-90 shadow-glow text-lg px-8">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass p-6 rounded-xl space-y-4 hover:shadow-glow transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold">Optimized Returns</h3>
            <p className="text-muted-foreground">
              AI algorithms continuously analyze market conditions to maximize your yields
              across multiple strategies.
            </p>
          </div>

          <div className="glass p-6 rounded-xl space-y-4 hover:shadow-glow transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold">Secure & Audited</h3>
            <p className="text-muted-foreground">
              Smart contracts built with security first, featuring automated risk management
              and protection mechanisms.
            </p>
          </div>

          <div className="glass p-6 rounded-xl space-y-4 hover:shadow-glow transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold">Auto-Compounding</h3>
            <p className="text-muted-foreground">
              Set it and forget it. Your yields are automatically harvested and
              reinvested for maximum compound growth.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold gradient-text">
            Ready to Amplify Your Yields?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users earning optimized returns with AlphaYield's
            AI-powered strategies.
          </p>
          <Link to="/app">
            <Button size="lg" className="gap-2 bg-gradient-hero hover:opacity-90 shadow-glow text-lg px-8">
              Launch App Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/alphayield-logo.png" alt="AlphaYield Logo" className="h-12 w-12" />
            <span className="font-bold">AlphaYield</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built on U2U Network
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
