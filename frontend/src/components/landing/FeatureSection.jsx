import { CheckCircle2, AlertTriangle, Users, Heart } from "lucide-react";

const iconMap = {
  check: CheckCircle2,
  alert: AlertTriangle,
  users: Users,
  heart: Heart
};

export function FeatureSection({ 
  badge, 
  badgeColor = "bg-[#E8F6F3] text-[#2C3E50]",
  title, 
  description, 
  features, 
  iconType = "check",
  imageSrc, 
  imageAlt,
  reversed = false,
  bgColor = "bg-[#FDFBF7]"
}) {
  const Icon = iconMap[iconType] || CheckCircle2;
  const iconColor = iconType === "alert" ? "text-[#D35400]" : "text-[#2C3E50]";
  
  return (
    <section className={`py-20 px-4 ${bgColor}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={reversed ? "order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-xl" : ""}>
            {!reversed && (
              <>
                <span className={`inline-block px-4 py-1 ${badgeColor} text-sm font-semibold rounded-full mb-4`}>
                  {badge}
                </span>
                <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                  {title}
                </h2>
                <p className="text-lg text-[#718096] mb-6">
                  {description}
                </p>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${iconColor} mt-1 flex-shrink-0`} />
                      <span className="text-[#4A5568]">{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {reversed && (
              <img 
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto object-cover"
              />
            )}
          </div>
          <div className={reversed ? "order-1 lg:order-2" : "relative rounded-2xl overflow-hidden shadow-xl"}>
            {reversed && (
              <>
                <span className={`inline-block px-4 py-1 ${badgeColor} text-sm font-semibold rounded-full mb-4`}>
                  {badge}
                </span>
                <h2 className="font-['Merriweather'] text-3xl sm:text-4xl font-bold text-[#1A202C] mb-4">
                  {title}
                </h2>
                <p className="text-lg text-[#718096] mb-6">
                  {description}
                </p>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${iconColor} mt-1 flex-shrink-0`} />
                      <span className="text-[#4A5568]">{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!reversed && (
              <img 
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
