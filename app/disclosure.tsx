import type {ReactNode} from 'react';
import {Collapsible,CollapsibleTrigger,CollapsibleContent} from '@/components/ui/collapsible';
export function Disclosure({title,children,defaultOpen=false}:{title:string;children:ReactNode;defaultOpen?:boolean}){return <Collapsible defaultOpen={defaultOpen} className="atlas-disclosure"><CollapsibleTrigger className="disclosure-trigger"><span>{title}</span><span className="disclosure-chevron" aria-hidden="true">⌄</span></CollapsibleTrigger><CollapsibleContent className="disclosure-content">{children}</CollapsibleContent></Collapsible>;}
