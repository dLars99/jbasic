export const defaultProgram: string = `10 LET X = 42
20 PRINT "Hello from jBASIC"
30 PRINT X
40 END
`;

export const fullFeatureTestProgram: string = `10 PRINT "jBASIC FEATURE TEST"
20 LET A = 1
30 PRINT "A=" + A
40 FOR I = 1 TO 3
50 PRINT "LOOP I=" + I
60 NEXT I
70 LET A = A + 5
80 PRINT "A after +=5: " + A
90 INPUT "Enter a word:" NAME
100 PRINT "Hello, " + NAME
110 INPUT "Enter a number:" X
120 PRINT "You entered: " + X
130 LET CNT = 0
140 LET CNT = CNT + 1
150 PRINT "CNT=" + CNT
160 IF CNT < 2 THEN GOTO 140
170 IF CNT = 2 THEN 180
180 PRINT "IF THEN without GOTO worked"
190 END
`;
