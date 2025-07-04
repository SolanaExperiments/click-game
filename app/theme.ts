import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        color: "#06F3C9", // fallback for all text
      },
    },
  },
  components: {
    Text: {
      baseStyle: {
        color: "#06F3C9",
      },
    },
    Heading: {
      baseStyle: {
        color: "#06F3C9",
      },
    },
    Table: {
      parts: ["th"],
      baseStyle: {
        th: {
          color: "#6C29D1",
        },
      },
    },
  },
});

export default theme;