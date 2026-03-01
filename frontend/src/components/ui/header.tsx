import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, MoveRight, X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const navigationItems = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Product',
    description: 'Everything you need to oversee AI agents at scale.',
    items: [
      { title: 'Live Activity',  href: '/#activity' },
      { title: 'Approvals',      href: '/#approvals' },
      { title: 'Spend Control',  href: '/#spend' },
      { title: 'Security',       href: '/#security' },
    ],
  },
  {
    title: 'Company',
    description: 'Built by engineers who ran agents in production.',
    items: [
      { title: 'About',         href: '/#about' },
      { title: 'Pricing',       href: '/#pricing' },
      { title: 'Contact',       href: '/#contact' },
      { title: 'Docs',          href: '#' },
    ],
  },
];

export function Header1() {
  const [isOpen, setOpen] = useState(false);

  return (
    <header className="w-full z-50 fixed top-0 left-0 bg-[#05060B]/80 backdrop-blur-lg border-b border-white/5">
      <div className="container relative mx-auto min-h-16 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center px-6">

        {/* Left — desktop nav */}
        <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
          <NavigationMenu className="flex justify-start items-start">
            <NavigationMenuList className="flex justify-start gap-2 flex-row">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Link to={item.href}>
                        <Button
                          variant="ghost"
                          className="text-[#A7ACBF] hover:text-white hover:bg-white/5"
                        >
                          {item.title}
                        </Button>
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm bg-transparent text-[#A7ACBF] hover:text-white hover:bg-white/5 data-[state=open]:bg-white/5 data-[state=open]:text-white">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[420px] p-4 bg-[#0B0E16] border border-white/10 rounded-xl">
                        <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                          <div className="flex flex-col h-full justify-between">
                            <div className="flex flex-col">
                              <p className="text-base text-[#F4F6FF] font-semibold">{item.title}</p>
                              <p className="text-[#A7ACBF] text-sm mt-1">{item.description}</p>
                            </div>
                            <Link to="/auth">
                              <Button size="sm" className="mt-10 bg-[#4F46E5] hover:bg-[#4338CA] text-white w-full">
                                Get early access
                              </Button>
                            </Link>
                          </div>
                          <div className="flex flex-col text-sm h-full justify-end gap-1">
                            {item.items?.map((subItem) => (
                              <Link
                                key={subItem.title}
                                to={subItem.href}
                                className="flex flex-row justify-between items-center hover:bg-white/5 py-2 px-3 rounded-lg text-[#A7ACBF] hover:text-white transition-colors"
                              >
                                <span>{subItem.title}</span>
                                <MoveRight className="w-4 h-4 text-[#4F46E5]" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Center — brand */}
        <div className="flex lg:justify-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#F4F6FF]">JARVIS</span>
          </Link>
        </div>

        {/* Right — CTAs */}
        <div className="flex justify-end w-full gap-3">
          <Link to="/auth" className="hidden md:inline-flex">
            <Button variant="ghost" className="text-[#A7ACBF] hover:text-white hover:bg-white/5">
              Login
            </Button>
          </Link>
          <div className="border-r border-white/10 hidden md:inline" />
          <Link to="/auth">
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex w-12 shrink lg:hidden items-end justify-end">
          <Button
            variant="ghost"
            className="text-[#A7ACBF] hover:text-white hover:bg-white/5 p-2"
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {isOpen && (
            <div className="absolute top-16 border-t border-white/5 flex flex-col w-full right-0 bg-[#05060B]/95 backdrop-blur-lg shadow-xl py-6 px-6 gap-6">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="flex justify-between items-center"
                        onClick={() => setOpen(false)}
                      >
                        <span className="text-lg text-[#F4F6FF]">{item.title}</span>
                        <MoveRight className="w-4 h-4 stroke-1 text-[#A7ACBF]" />
                      </Link>
                    ) : (
                      <p className="text-lg text-[#F4F6FF]">{item.title}</p>
                    )}
                    {item.items?.map((subItem) => (
                      <Link
                        key={subItem.title}
                        to={subItem.href}
                        className="flex justify-between items-center py-1"
                        onClick={() => setOpen(false)}
                      >
                        <span className="text-[#A7ACBF]">{subItem.title}</span>
                        <MoveRight className="w-4 h-4 stroke-1 text-[#4F46E5]" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full text-[#A7ACBF] hover:text-white hover:bg-white/5">
                    Login
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white border-0">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
