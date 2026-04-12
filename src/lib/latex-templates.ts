export const DEFAULT_LATEX_TEMPLATE = `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries Your Name}\\\\[4pt]
  your.email@example.com \\quad | \\quad (555) 123-4567 \\quad | \\quad City, State\\\\
  \\href{https://linkedin.com/in/yourprofile}{LinkedIn} \\quad | \\quad \\href{https://github.com/yourusername}{GitHub}
\\end{center}

\\section{Education}
\\textbf{University Name} \\hfill Expected May 2025\\\\
Bachelor of Science in Computer Science \\hfill GPA: 3.8/4.0

\\section{Experience}
\\textbf{Software Engineer Intern} \\hfill June 2024 -- August 2024\\\\
\\textit{Company Name} \\hfill City, State
\\begin{itemize}[leftmargin=*,noitemsep]
  \\item Developed REST APIs using Node.js and Express, serving 10K+ daily requests
  \\item Implemented automated testing pipeline reducing bug reports by 30\\%
  \\item Collaborated with a team of 5 engineers using Agile methodology
\\end{itemize}

\\section{Projects}
\\textbf{Project Name} \\hfill \\href{https://github.com/yourproject}{GitHub}
\\begin{itemize}[leftmargin=*,noitemsep]
  \\item Built a full-stack web application using React and Python Flask
  \\item Integrated PostgreSQL database with optimized queries for sub-100ms response times
\\end{itemize}

\\section{Skills}
\\textbf{Languages:} Python, JavaScript, TypeScript, Java, C++, SQL\\\\
\\textbf{Frameworks:} React, Next.js, Node.js, Express, Flask\\\\
\\textbf{Tools:} Git, Docker, AWS, PostgreSQL, MongoDB

\\end{document}`;
