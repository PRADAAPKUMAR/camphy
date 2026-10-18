import MCQOptionGroup from "@/components/question-mode/MCQOptionGroup";

interface OptionButtonsProps {
  question: number;
  userAnswer?: string;
  correctAnswer?: string;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

/** Four large option buttons with instant correct/wrong colouring and locking. */
const OptionButtons = ({
  question,
  userAnswer,
  correctAnswer,
  onSelect,
  disabled,
}: OptionButtonsProps) => {
  return <MCQOptionGroup question={question} userAnswer={userAnswer} correctAnswer={correctAnswer} onSelect={onSelect} disabled={disabled} />;
};

export default OptionButtons;
