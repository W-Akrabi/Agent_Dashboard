import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue, easeOut } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Rotation goes from face-up (55°) to face-forward (0°) over the first 80% of scroll,
  // then holds flat so the exit feels settled.
  const rotate = useTransform(scrollYProgress, [0, 0.8], [55, 0], { ease: easeOut });
  const scale = useTransform(
    scrollYProgress,
    [0, 0.8],
    isMobile ? [0.75, 1] : [0.88, 1],
    { ease: easeOut }
  );

  return (
    // Tall outer container gives us scroll room; 250vh = plenty of travel time
    <div ref={containerRef} className="relative h-[250vh]">
      {/* Sticky inner keeps everything centred while we scroll through */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-4 md:px-20">
        <div className="w-full" style={{ perspective: "1200px" }}>
          <Header titleComponent={titleComponent} />
          <Card rotate={rotate} scale={scale}>
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Header = ({
  titleComponent,
}: {
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <div className="max-w-5xl mx-auto text-center mb-8">
      {titleComponent}
    </div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4">
        {children}
      </div>
    </motion.div>
  );
};
