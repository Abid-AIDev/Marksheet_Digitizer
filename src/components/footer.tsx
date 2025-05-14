// src/components/footer.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import MohammedAbidImg from '@/components/img/Mohammed-Abid.jpg';
import MrJithinImg from '@/components/img/Mr.Jithin.png';

const Footer = () => {
  return (
    <footer className="bg-muted/50 text-muted-foreground py-12 border-t">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          <div className="md:col-span-1 flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-primary mb-2">MarkSheet Digitizer</h3>
            <p className="text-sm">&copy; {new Date().getFullYear()} MarkSheet Digitizer. All rights reserved.</p>
            <p className="text-xs mt-1">AI-Powered Marksheet Processing</p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h4 className="text-md font-semibold text-foreground mb-3">Developed by:</h4>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                <Image
                  src={MohammedAbidImg}
                  alt="Mohammed Abid "
                  width={80}
                  height={80}
                  className="rounded-full shadow-md object-cover"
                  data-ai-hint="person portrait"
                />
                <div>
                  <p className="font-medium text-foreground">Mohammed Abid U</p>
                  <p className="text-xs">Dept: AD</p>
                </div>
              </div>
            </div>
            <div>
               <h4 className="text-md font-semibold text-foreground mb-3">Guided by:</h4>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Image
                  src={MrJithinImg}
                  alt="Mr.Jithin K C"
                  width={80}
                  height={80}
                  className="rounded-full shadow-md object-cover"
                  data-ai-hint="person portrait"
                />
                <div>
                  <p className="font-medium text-foreground">Mr. Jithin K C</p>
                  <p className="text-xs">Assistant Professor</p>
                  <p className="text-xs">Dept: AD</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-border/70" />
        <div className="text-center text-xs">
          <p>
            This tool is designed to streamline the marksheet digitization process.
          </p>
          <p className="mt-1">
            For support, contact <Link href="mailto:abid.in.ae.cs@gmail.com" className="text-primary hover:underline">abid.in.ae.cs@gmail.com</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
