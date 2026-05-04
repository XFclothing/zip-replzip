import React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SiInstagram, SiTiktok } from "react-icons/si";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: "Message Sent",
      description: "We will get back to you shortly.",
    });
    form.reset();
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-widest mb-6">
            Contact
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Inquiries, press, or support.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase tracking-widest text-xs text-muted-foreground">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="YOUR NAME" className="rounded-none border-t-0 border-x-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase tracking-widest text-xs text-muted-foreground">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="YOUR EMAIL" className="rounded-none border-t-0 border-x-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase tracking-widest text-xs text-muted-foreground">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="YOUR MESSAGE" 
                          className="rounded-none border-t-0 border-x-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-primary px-0 text-lg min-h-[150px] resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" size="lg" className="w-full rounded-none uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all h-14">
                  Submit
                </Button>
              </form>
            </Form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-12"
          >
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Find Us</h3>
              <div className="flex gap-8">
                <a href="https://www.instagram.com/xfclothing2026/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors group">
                  <SiInstagram className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="uppercase tracking-widest text-sm">@xfclothing2026</span>
                </a>
                <a href="https://www.tiktok.com/@xf.clothing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors group">
                  <SiTiktok className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="uppercase tracking-widest text-sm">@xf.clothing</span>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Studio</h3>
              <p className="uppercase tracking-widest text-sm leading-loose">
                Germany<br/>
                Concept Space<br/>
                By Appointment Only
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
