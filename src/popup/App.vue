<template>
  <div style="height: 500px; width: 450px">
    <div class="yale-nav">
      <el-button
        icon="el-icon-setting"
        @click="settingDialogVisible = true"
      ></el-button>
    </div>
    <header><h1>New Bookmark</h1></header>
    <div style="height: 45px"></div>
    <el-row :gutter="10">
      <el-col :span="4">
        <p style="text-align: right">URL</p>
      </el-col>
      <el-col :span="18" style="margin: auto">
        <div class="tags-input-root">
          <el-input
            class="yale-input"
            v-model="currentUrl"
            v-loading.fullscreen.lock="fullscreenLoading"
            >></el-input
          >
        </div>
      </el-col>
      <el-col :span="2"> </el-col>
    </el-row>
    <el-row :gutter="10">
      <el-col :span="4">
        <p style="text-align: right">Title</p>
      </el-col>
      <el-col :span="18" style="margin: auto">
        <el-input class="yale-input" v-model="currentTitle"></el-input>
      </el-col>
      <el-col :span="2"> </el-col>
    </el-row>
    <el-row :gutter="10">
      <el-col :span="4">
        <p style="text-align: right">Description</p>
      </el-col>
      <el-col :span="18" style="margin: auto">
        <el-input class="yale-input" v-model="currentDescription"></el-input>
      </el-col>
      <el-col :span="2"> </el-col>
    </el-row>
    <el-row :gutter="10">
      <el-col :span="4">
        <p style="text-align: right">Tags</p>
      </el-col>
      <el-col :span="18" style="margin: auto">
        <tags-input
          element-id="tags"
          v-model="selectedTags"
          :existing-tags="existingTags"
          :typeahead="true"
          @change="search_tags_no_promise"
          :add-tags-on-comma="true"
          :delete-on-backspace="true"
          typeahead-style="badges"
          value-fields="value"
          class="yale-input yale-tags"
          placeholder=""
        ></tags-input>
      </el-col>
      <el-col :span="2"> </el-col>
    </el-row>
    <el-row :gutter="10">
      <el-col :span="4">
        <p style="text-align: right">List</p>
      </el-col>
      <el-col :span="18" style="margin: auto">
        <tags-input
          element-id="lists"
          v-model="selectedLists"
          :existing-tags="existingLists"
          :typeahead="true"
          @change="search_lists_no_promise"
          :add-tags-on-comma="true"
          :delete-on-backspace="true"
          class="yale-input yale-lists"
          placeholder=""
        ></tags-input>
      </el-col>
      <el-col :span="2"> </el-col>
    </el-row>
    <div style="height: 40px"></div>
    <el-row>
      <el-col>
        <div style="text-align: center">
          <el-button @click="submit">Save</el-button>
        </div>
      </el-col>
    </el-row>
    <el-dialog
      title="Settings"
      :visible.sync="settingDialogVisible"
      width="90%"
      center
    >
      <div>
        <el-row :gutter="10">
          <el-col :span="4">
            <p style="text-align: right">Address</p>
          </el-col>
          <el-col :span="18" style="margin: auto">
            <div class="tags-input-root">
              <el-input
                class="yale-input"
                placeholder="LinkAce Url without last '/'"
                v-model="apiUrl"
              ></el-input>
            </div>
          </el-col>
          <el-col :span="2"> </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="4">
            <p style="text-align: right">Token</p>
          </el-col>
          <el-col :span="18" style="margin: auto">
            <div class="tags-input-root">
              <el-input class="yale-input" v-model="apiToken"></el-input>
            </div>
          </el-col>
          <el-col :span="2"> </el-col>
        </el-row>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="test_api">Test</el-button>
        <el-button type="primary" @click="save_api_info">Save</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      selectedTags: [],
      selectedTagsManual: [],
      selectedLists: [],
      existingLists: [],
      existingTags: [],
      currentTitle: "",
      currentUrl: "",
      currentDescription: "",
      settingDialogVisible: false,
      apiUrl: "",
      apiToken: "",
      fullscreenLoading: false,
    };
  },
  watch: {
    apiUrl: function (newApiUrl) {
      this.$axios.defaults.baseURL = newApiUrl;
    },
    apiToken: function (newApiToken) {
      this.$axios.defaults.headers.common["authorization"] =
        "Bearer " + newApiToken;
    },
  },
  created() {
    this.$axios.defaults.timeout = 5000;
    this.get_api_info();
  },

  mounted() {
    this.fetch_current_tab_from_linkace();
  },

  methods: {
    fetch_current_tab_from_linkace() {
      this.fullscreenLoading = true;
      chrome.storage.sync.get({ yalePageStatus: -2 }, (item) => {
        // haven't check current page yet
        if (item.yalePageStatus == -2) {
          chrome.runtime.sendMessage({
            recipient: "background.js",
            type: "checkTab",
          });
          setTimeout(() => {
            this.fetch_current_tab_from_linkace();
          }, 1000);
        }
        // current page is not in LinkAce
        else if (item.yalePageStatus == -1) {
          this.get_current_tab_info();
          this.fullscreenLoading = false;
        }
        // current page is in LinkAce
        else {
          let linkId = item.yalePageStatus;
          this.$axios.get("/api/v1/links/" + linkId).then(
            (res) => {
              this.fullscreenLoading = false;
              this.currentTitle = res.data.title;
              this.currentUrl = res.data.url;
              this.currentDescription = res.data.description;
              for (let tag of res.data.tags) {
                this.selectedTags.push({ key: tag.id, value: tag.name });
              }
              for (let list of res.data.lists) {
                this.selectedLists.push({ key: list.id, value: list.name });
              }
            },
            () => {
              this.$message.error(
                "please check the api info and network connectin."
              );
              this.settingDialogVisible = true;
            }
          );
        }
      });
    },

    get_api_info() {
      chrome.storage.sync.get({ yaleApi: "", yaleToken: "" }, (item) => {
        if (item.yaleApi && item.yaleToken) {
          this.apiUrl = item.yaleApi;
          this.apiToken = item.yaleToken;
        } else {
          this.$message.warning("please set up the api address and api token");
          setTimeout(() => {
            this.settingDialogVisible = true;
          }, 1500);
        }
      });
    },
    save_api_info() {
      chrome.storage.sync.set(
        { yaleApi: this.apiUrl, yaleToken: this.apiToken },
        () => {
          this.$message({
            message: "save successfully",
            type: "success",
          });
          chrome.runtime.sendMessage({
            recipient: "background.js",
            type: "apiInfo",
            content: { apiUrl: this.apiUrl, apiToken: this.apiToken },
          });
          location.reload();
        }
      );
    },

    test_api() {
      this.$axios.get(this.apiUrl + "/api/v1/links/1").then(
        () => {
          this.$message({
            message: "api is ok",
            type: "success",
          });
        },
        (err) => {
          if (err.response.status == 404) {
            this.$message({
              message: "api is ok",
              type: "success",
            });
          } else {
            this.$message({
              message: "api is not ok",
              type: "error",
            });
          }
        }
      );
    },
    submit() {
      let tags = [];
      let lists = [];
      for (let item of this.selectedTags) {
        tags.push(item.value);
      }
      for (let item of this.selectedLists) {
        lists.push(item.value);
      }

      chrome.storage.sync.get({ yalePageStatus: "" }, (item) => {
        if (item.yalePageStatus == -1) {
          // create a new bookmark
          this.$axios
            .post("/api/v1/links", {
              url: this.currentUrl,
              title: this.currentTitle,
              description: this.currentDescription,
              lists: lists,
              tags: tags,
              is_private: true,
              check_disabled: false,
            })
            .then(
              (res) => {
                this.$message.success("success");
                setTimeout(() => {
                  window.close();
                }, 1000);
                chrome.runtime.sendMessage({
                  recipient: "background.js",
                  type: "checkTab",
                });
              },

              (err) => {
                this.$message(err);
              }
            );
        } else {
          // update an existsing bookmark
          this.$axios
            .patch("/api/v1/links/" + item.yalePageStatus, {
              url: this.currentUrl,
              title: this.currentTitle,
              description: this.currentDescription,
              lists: lists,
              tags: tags,
              is_private: true,
              check_disabled: false,
            })
            .then(
              () => {
                this.$message.success("success");
                setTimeout(() => {
                  window.close();
                }, 1000);
              },
              (err) => {
                this.$message(err);
              }
            );
        }
      });
    },
    get_current_tab_info() {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        this.currentUrl = tabs[0].url;
        this.currentTitle = tabs[0].title;
      });

      chrome.tabs.executeScript(
        {
          code: 'document.querySelector("meta[name=\'description\']").getAttribute("content")',
        },
        (res) => {
          if (!res) {
            return;
          }
          this.currentDescription = res[0];
        }
      );
    },
    search_tags(query) {
      return new Promise((resolve) => {
        this.$axios
          .get("/api/v1/search/tags", {
            params: { query: query },
          })
          .then((res) => {
            let result = [];
            for (let key in res.data) {
              result.push({ key: key, value: res.data[key] });
            }
            resolve(result);
          });
      });
    },
    search_tags_no_promise(query) {
      this.$axios
        .get("/api/v1/search/tags", {
          params: { query: query },
        })
        .then((res) => {
          this.existingTags = [];
          for (let key in res.data) {
            this.existingTags.push({ key: key, value: res.data[key] });
          }
        });
    },
    search_lists_no_promise(query) {
      this.$axios
        .get("/api/v1/search/lists", {
          params: { query: query },
        })
        .then((res) => {
          this.existingLists = [];
          for (let key in res.data) {
            this.existingLists.push({ key: key, value: res.data[key] });
          }
        });
    },
  },
};
</script>

<style>
@import "./popup.css";
</style>


