import Image from "next/image";
import TicketForm from "@/components/TicketForm";
import { getShowData } from "@/lib/show";
import Link from "next/link";

const textImages = [
  // { src: "/text/im doing a.jpeg", alt: "I'm doing a" },
  // { src: "/text/one man show.jpeg", alt: "one man show" },
  // { src: "/text/probably called.jpeg", alt: "probably called" },
  {
    src: "/text/midlife highfive deepdive.jpeg",
    alt: "midlife highfive deepdive",
  },
  // { src: "/text/you should come.jpeg", alt: "you should come" },
  // { src: "/text/and watch it.jpeg", alt: "and watch it" },
];

export default async function Home() {
  const show = await getShowData();

  if (!show || !show.title) {
    return (
      <div className="p-8">
        <p>Show details coming soon...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Text images in 3x2 grid */}
      <div className="grid grid-cols-1 gap-2 mb-8 max-w-xs">
        {textImages.map((img, i) => (
          <Image
            key={i}
            src={img.src}
            alt={img.alt}
            width={200}
            height={200}
            className="w-full h-auto"
          />
        ))}
      </div>

      {show.venue && (
        <Link
          href={"https://maps.app.goo.gl/V7jJBhPj8GNQAWNd9"}
          target="_blank"
          className="block mb-2"
        >
          <strong>Venue:</strong> {show.venue}
        </Link>
      )}
      {show.startTime && (
        <p>
          <strong>Time:</strong> {show.startTime}
        </p>
      )}
      {show.doorsOpen && (
        <p>
          <strong>Doors Open:</strong> {show.doorsOpen}
        </p>
      )}

      <TicketForm />
    </div>
  );
}
