import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PortalHeading } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newTrackingNumber } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/admin/shipments/new")({ component: NewShipment });
const nav = [{ to: "/admin", label: "Overview", icon: Package, exact: true }, { to: "/admin/shipments", label: "Shipments", icon: Package }, { to: "/admin/customers", label: "Customers", icon: Package }, { to: "/admin/tracking", label: "Tracking", icon: Package }, { to: "/dashboard", label: "Customer portal", icon: Package }];

function NewShipment() { const navigate = useNavigate(); const [busy,setBusy]=useState(false); const [f,setF]=useState({tracking_number:newTrackingNumber(),user_id:"",origin:"",destination:"",service_level:"standard",cargo_type:"",weight_kg:"",pieces:"1",recipient_name:"",recipient_phone:"",estimated_delivery:"",price:"",description:""}); const set=(k:keyof typeof f,v:string)=>setF(x=>({...x,[k]:v}));
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);try{const {data,error}=await supabase.from("shipments").insert({tracking_number:f.tracking_number.trim().toUpperCase(),user_id:f.user_id||null,origin:f.origin,destination:f.destination,service_level:f.service_level,cargo_type:f.cargo_type||null,weight_kg:f.weight_kg?Number(f.weight_kg):null,pieces:Number(f.pieces)||1,recipient_name:f.recipient_name||null,recipient_phone:f.recipient_phone||null,estimated_delivery:f.estimated_delivery||null,price:f.price?Number(f.price):null,description:f.description||null}).select("id").single();if(error)throw error;toast.success("Shipment created");navigate({to:"/admin/shipments/$id",params:{id:data.id}})}catch(err){toast.error((err as Error).message)}finally{setBusy(false)}}
 return <PortalShell kind="Admin console" nav={nav}><PortalHeading title="New shipment" subtitle="Create a shipment and assign it to a customer account." /><form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">{Object.entries({tracking_number:"Tracking number",user_id:"Customer user ID",origin:"Origin",destination:"Destination",service_level:"Service level",cargo_type:"Cargo type",weight_kg:"Weight (kg)",pieces:"Pieces",recipient_name:"Recipient name",recipient_phone:"Recipient phone",estimated_delivery:"Estimated delivery",price:"Price",description:"Description"}).map(([k,label])=><div key={k}><Label className="eyebrow">{label}</Label><Input value={f[k as keyof typeof f]} onChange={e=>set(k as keyof typeof f,e.target.value)} className="mt-2 rounded-none" required={k==="tracking_number"||k==="origin"||k==="destination"} /></div>)}<div className="sm:col-span-2"><Button disabled={busy} type="submit" className="rounded-none">{busy?"Creating…":"Create shipment"}</Button></div></form></PortalShell> }
