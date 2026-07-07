import React from "react";

// Define the interface to extend standard SVG properties
interface DealPlateLogoProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

const DealPlateLogo: React.FC<DealPlateLogoProps> = ({
    className = "w-48 h-auto",
    ...props
}) => {
    return (
        <svg
            className={className}
            viewBox="0 0 240 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            {/* The Icon: A stylized 'D' merging with a leaf/plate motif 
        to symbolize food and deals. 
      */}
            <path
                d="M14 12L32 12C43.0457 12 52 20.9543 52 32C52 43.0457 43.0457 52 32 52L14 52V12Z"
                stroke="#16a34a"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M32 20C38.6274 20 44 25.3726 44 32C44 32 34 32 29 37C29 27 29 20 32 20Z"
                fill="#f97316"
            />

            {/* The Typography: Bold, readable sans-serif text using the brand colors.
             */}
            <text
                x="65"
                y="42"
                fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                fontSize="32"
                fontWeight="800"
                letterSpacing="-0.025em"
            >
                <tspan fill="#16a34a">Deal</tspan>
                <tspan fill="#f97316">Plate</tspan>
            </text>
        </svg>
    );
};

export default DealPlateLogo;
